import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateNutritionPlan,
  generateFitnessPlan,
  generateWellnessPlan,
  savePersonalizedPlans,
} from '../utils/personalization';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface Question {
  id: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'number_with_units' | 'height_input' | 'select_with_info';
  placeholder?: string;
  options?: string[];
  units?: string[];
  subtitle?: string;
  hasInfo?: boolean;
  min?: number;
  max?: number;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { updateProfile, startTrial } = useUser();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [units, setUnits] = useState({
    weight: 'lbs',
    height: 'ft'
  });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', description: '' });

  const nutritionInfo: { [key: string]: { title: string; description: string } } = {
    'High Protein': {
      title: 'High Protein Diet',
      description: 'Emphasizes protein-rich foods (30-35% of calories). Great for muscle building, weight loss, and satiety. Includes lean meats, fish, eggs, dairy, legumes, and protein supplements.'
    },
    'Low Carb': {
      title: 'Low Carb Diet',
      description: 'Restricts carbohydrates (20-25% of calories), focusing on proteins and fats. Can help with weight loss and blood sugar control. Limits grains, sugars, and starchy vegetables.'
    },
    'Balanced': {
      title: 'Balanced Diet',
      description: 'Follows standard macronutrient ratios (50% carbs, 25% protein, 25% fat). Includes all food groups in moderation for overall health and sustainability.'
    },
    'Plant-Based': {
      title: 'Plant-Based Diet',
      description: 'Focuses on foods derived from plants including vegetables, fruits, nuts, seeds, oils, whole grains, legumes, and beans. May include or exclude animal products.'
    },
    'Mediterranean': {
      title: 'Mediterranean Diet',
      description: 'Based on traditional eating patterns of Mediterranean countries. Emphasizes olive oil, fish, vegetables, fruits, whole grains, and moderate wine consumption.'
    },
    'Flexible Dieting': {
      title: 'Flexible Dieting (IIFYM)',
      description: 'If It Fits Your Macros - allows any food as long as it fits within daily macro targets. Provides flexibility while maintaining nutritional goals.'
    }
  };

  const questions: Question[] = [
    {
      id: 'name',
      question: "What's your name?",
      type: 'text',
      placeholder: 'Enter your name',
    },
    {
      id: 'gender',
      question: 'What is your biological sex?',
      type: 'select',
      options: ['Male', 'Female'],
      subtitle: 'This helps us calculate accurate calorie and macro targets'
    },
    {
      id: 'age',
      question: 'How old are you?',
      type: 'number',
      placeholder: 'Enter your age',
      min: 13,
      max: 100
    },
    {
      id: 'weight',
      question: 'What is your current weight?',
      type: 'number_with_units',
      units: ['lbs', 'kg'],
      placeholder: 'Enter your weight',
    },
    {
      id: 'height',
      question: 'How tall are you?',
      type: 'height_input',
      units: ['ft', 'cm'],
      placeholder: 'Enter your height',
    },
    {
      id: 'fitnessGoal',
      question: 'What is your primary fitness goal?',
      type: 'select',
      options: ['Lose Weight', 'Build Muscle', 'Maintain Weight', 'Improve Endurance', 'General Health'],
      subtitle: 'This determines your calorie target and macro distribution'
    },
    {
      id: 'targetWeight',
      question: 'What is your target weight?',
      type: 'number_with_units',
      units: ['lbs', 'kg'],
      placeholder: 'Enter your target weight',
      subtitle: 'Optional - helps us set realistic timelines'
    },
    {
      id: 'experience',
      question: 'What is your fitness experience level?',
      type: 'select',
      options: ['Beginner', 'Intermediate', 'Advanced'],
      subtitle: 'Affects workout intensity and progression recommendations'
    },
    {
      id: 'workoutPreference',
      question: 'What type of workouts do you prefer?',
      type: 'select',
      options: ['Strength Training', 'Cardio', 'HIIT', 'Flexibility/Yoga', 'Mixed'],
    },
    {
      id: 'timeAvailable',
      question: 'How much time can you dedicate to workouts per week?',
      type: 'select',
      options: ['Less than 2 hours', '2-4 hours', '4-6 hours', '6-8 hours', 'More than 8 hours'],
    },
    {
      id: 'activityLevel',
      question: 'How would you describe your daily activity level?',
      type: 'select',
      options: [
        'Sedentary (desk job, little exercise)',
        'Lightly Active (light exercise 1-3 days/week)',
        'Moderately Active (moderate exercise 3-5 days/week)',
        'Very Active (hard exercise 6-7 days/week)',
        'Extremely Active (very hard exercise, physical job)'
      ],
      subtitle: 'This significantly affects your daily calorie needs'
    },
    {
      id: 'nutritionPreference',
      question: 'What nutrition approach interests you most?',
      type: 'select_with_info',
      options: ['High Protein', 'Low Carb', 'Balanced', 'Plant-Based', 'Mediterranean', 'Flexible Dieting'],
      subtitle: 'Affects your macro distribution recommendations',
      hasInfo: true
    },
    {
      id: 'sleepHours',
      question: 'How many hours do you typically sleep per night?',
      type: 'number',
      placeholder: 'Enter hours of sleep',
      min: 4,
      max: 12,
      subtitle: 'Sleep affects metabolism and recovery'
    },
    {
      id: 'stressLevel',
      question: 'How would you rate your typical stress level?',
      type: 'select',
      options: ['Low', 'Moderate', 'High', 'Very High'],
      subtitle: 'Stress affects cortisol levels and weight management'
    },
    {
      id: 'motivation',
      question: 'What motivates you most? (Select all that apply)',
      type: 'multiselect',
      options: ['Health', 'Appearance', 'Energy', 'Strength', 'Confidence', 'Competition', 'Longevity'],
    },
    {
      id: 'challenges',
      question: 'What are your biggest fitness challenges?',
      type: 'multiselect',
      options: ['Time', 'Motivation', 'Knowledge', 'Consistency', 'Injury/Pain', 'Equipment', 'Diet', 'Social Support'],
    },
    {
      id: 'mealFrequency',
      question: 'How many meals do you prefer to eat per day?',
      type: 'select',
      options: ['2 meals', '3 meals', '4-5 small meals', '6+ small meals', 'Intermittent fasting'],
      subtitle: 'Helps us suggest meal timing and portion sizes'
    },
    {
      id: 'goal',
      question: 'What would you like to achieve in the next 3 months?',
      type: 'text',
      placeholder: 'Describe your 3-month goal',
    },
  ];

  const handleAnswer = (value: any) => {
    setAnswers({ ...answers, [questions[currentStep].id]: value });
  };

  const handleUnitChange = (type: 'weight' | 'height', unit: string) => {
    setUnits({ ...units, [type]: unit });
  };

  const showInfo = (option: string) => {
    const info = nutritionInfo[option];
    if (info) {
      setInfoContent(info);
      setShowInfoModal(true);
    }
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateBMR = (weightKg: number, heightCm: number, age: number, gender: string) => {
    if (gender.toLowerCase() === 'male') {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
  };

  const getActivityMultiplier = (activityLevel: string) => {
    const multipliers: { [key: string]: number } = {
      'Sedentary (desk job, little exercise)': 1.2,
      'Lightly Active (light exercise 1-3 days/week)': 1.375,
      'Moderately Active (moderate exercise 3-5 days/week)': 1.55,
      'Very Active (hard exercise 6-7 days/week)': 1.725,
      'Extremely Active (very hard exercise, physical job)': 1.9
    };
    return multipliers[activityLevel] || 1.2;
  };

  const adjustCaloriesForGoal = (tdee: number, goal: string, targetWeight?: number, currentWeight?: number) => {
    let calories = tdee;
    
    switch (goal) {
      case 'Lose Weight':
        const deficitPercentage = currentWeight && currentWeight > 90 ? 0.25 : 0.20;
        calories = tdee * (1 - deficitPercentage);
        break;
      case 'Build Muscle':
        calories = tdee * 1.15;
        break;
      case 'Maintain Weight':
        calories = tdee;
        break;
      case 'Improve Endurance':
        calories = tdee * 1.05;
        break;
      case 'General Health':
        calories = tdee;
        break;
    }

    const minimumCalories = (tdee / getActivityMultiplier(answers.activityLevel || 'Sedentary (desk job, little exercise)')) * 1.1;
    return Math.max(calories, minimumCalories);
  };

  const calculateMacros = (calories: number, nutritionPreference: string, fitnessGoal: string) => {
    let proteinRatio = 0.25;
    let fatRatio = 0.25;
    let carbRatio = 0.50;

    switch (nutritionPreference) {
      case 'High Protein':
        proteinRatio = 0.35;
        fatRatio = 0.25;
        carbRatio = 0.40;
        break;
      case 'Low Carb':
        proteinRatio = 0.30;
        fatRatio = 0.45;
        carbRatio = 0.25;
        break;
      case 'Plant-Based':
        proteinRatio = 0.20;
        fatRatio = 0.25;
        carbRatio = 0.55;
        break;
      case 'Mediterranean':
        proteinRatio = 0.20;
        fatRatio = 0.35;
        carbRatio = 0.45;
        break;
      case 'Flexible Dieting':
        proteinRatio = 0.25;
        fatRatio = 0.25;
        carbRatio = 0.50;
        break;
    }

    if (fitnessGoal === 'Build Muscle') {
      proteinRatio = Math.max(proteinRatio, 0.30);
    }

    return {
      protein: (calories * proteinRatio) / 4,
      carbs: (calories * carbRatio) / 4,
      fat: (calories * fatRatio) / 9,
    };
  };

  const completeOnboarding = async () => {
    // Convert units to metric for calculations
    const weightInKg = units.weight === 'kg' ? answers.weight : answers.weight * 0.453592;
    const heightInCm = units.height === 'cm' ? answers.height : 
      (Math.floor(answers.height) * 30.48) + ((answers.height % 1) * 12 * 2.54);

    // Calculate BMR
    const bmr = calculateBMR(weightInKg, heightInCm, answers.age, answers.gender);
    
    // Calculate TDEE
    const activityMultiplier = getActivityMultiplier(answers.activityLevel);
    const tdee = bmr * activityMultiplier;
    
    // Adjust calories based on goal
    const dailyCalories = adjustCaloriesForGoal(tdee, answers.fitnessGoal, answers.targetWeight, weightInKg);
    
    // Calculate macros
    const macros = calculateMacros(dailyCalories, answers.nutritionPreference, answers.fitnessGoal);
    
    const profile = {
      ...answers,
      weight: answers.weight,
      height: answers.height,
      weightUnit: units.weight,
      heightUnit: units.height,
      weightInKg,
      heightInCm,
      isPremium: false,
      dailyCalories: Math.round(dailyCalories),
      dailyProtein: Math.round(macros.protein),
      dailyCarbs: Math.round(macros.carbs),
      dailyFat: Math.round(macros.fat),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      motivation: answers.motivation || [],
      challenges: answers.challenges || [],
    };

    updateProfile(profile);
    try {
      await AsyncStorage.setItem('aifit_onboarding_completed', 'true');
      
      // Generate personalized plans
      const nutritionPlan = generateNutritionPlan(profile);
      const fitnessPlan = generateFitnessPlan(profile);
      const wellnessPlan = generateWellnessPlan(profile);
      
      // Save personalized plans
      await savePersonalizedPlans(nutritionPlan, fitnessPlan, wellnessPlan);
      
      // Start 3-day free trial
      await startTrial();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    onComplete();
  };

  const skipOnboarding = async () => {
    const defaultProfile = {
      name: 'User',
      gender: 'Male',
      age: 25,
      weight: 70,
      height: 175,
      weightUnit: 'kg',
      heightUnit: 'cm',
      weightInKg: 70,
      heightInCm: 175,
      fitnessGoal: 'General Health',
      targetWeight: 70,
      experience: 'Beginner',
      workoutPreference: 'Mixed',
      timeAvailable: '2-4 hours',
      activityLevel: 'Moderately Active (moderate exercise 3-5 days/week)',
      nutritionPreference: 'Balanced',
      motivation: ['Health', 'Energy'],
      challenges: ['Time', 'Consistency'],
      mealFrequency: '3 meals',
      goal: 'Improve overall fitness and health',
      isPremium: false,
      dailyCalories: 2000,
      dailyProtein: 125,
      dailyCarbs: 250,
      dailyFat: 67,
      bmr: 1650,
      tdee: 2000,
    };

    updateProfile(defaultProfile);
    try {
      await AsyncStorage.setItem('aifit_onboarding_completed', 'true');
      // Start 3-day free trial
      await startTrial();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    onComplete();
  };

  const currentAnswer = answers[questions[currentStep]?.id];
  const canProceed = currentAnswer !== undefined && currentAnswer !== '' && 
    (questions[currentStep]?.type !== 'multiselect' || 
     (Array.isArray(currentAnswer) && currentAnswer.length > 0));

  const renderHeightInput = () => {
    if (units.height === 'ft') {
      const feet = Math.floor(currentAnswer || 0);
      const inches = Math.round(((currentAnswer || 0) % 1) * 12);
      
      return (
        <View style={styles.heightInputContainer}>
          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={[styles.unitButton, units.height === 'ft' && styles.unitButtonActive]}
              onPress={() => handleUnitChange('height', 'ft')}
            >
              <Text style={[styles.unitButtonText, units.height === 'ft' && styles.unitButtonTextActive]}>Feet & Inches</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, units.height === 'cm' && styles.unitButtonActive]}
              onPress={() => handleUnitChange('height', 'cm')}
            >
              <Text style={[styles.unitButtonText, units.height === 'cm' && styles.unitButtonTextActive]}>Centimeters</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heightRow}>
            <View style={styles.heightInputGroup}>
              <Text style={styles.heightInputLabel}>Feet</Text>
              <TextInput
                style={styles.heightInput}
                placeholder="5"
                keyboardType="numeric"
                value={feet.toString()}
                onChangeText={(text) => {
                  const newFeet = parseInt(text) || 0;
                  const currentInches = ((currentAnswer || 0) % 1) * 12;
                  handleAnswer(newFeet + currentInches / 12);
                }}
              />
            </View>
            <View style={styles.heightInputGroup}>
              <Text style={styles.heightInputLabel}>Inches</Text>
              <TextInput
                style={styles.heightInput}
                placeholder="8"
                keyboardType="numeric"
                value={inches.toString()}
                onChangeText={(text) => {
                  const newInches = parseInt(text) || 0;
                  const currentFeet = Math.floor(currentAnswer || 0);
                  handleAnswer(currentFeet + newInches / 12);
                }}
              />
            </View>
          </View>
          {currentAnswer && (
            <Text style={styles.conversionText}>
              {Math.floor(currentAnswer)}'{Math.round(((currentAnswer % 1) * 12))}" 
              ({Math.round((Math.floor(currentAnswer) * 30.48) + (((currentAnswer % 1) * 12) * 2.54))} cm)
            </Text>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.heightInputContainer}>
          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={[styles.unitButton, units.height === 'ft' && styles.unitButtonActive]}
              onPress={() => handleUnitChange('height', 'ft')}
            >
              <Text style={[styles.unitButtonText, units.height === 'ft' && styles.unitButtonTextActive]}>Feet & Inches</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, units.height === 'cm' && styles.unitButtonActive]}
              onPress={() => handleUnitChange('height', 'cm')}
            >
              <Text style={[styles.unitButtonText, units.height === 'cm' && styles.unitButtonTextActive]}>Centimeters</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="170"
            keyboardType="numeric"
            value={currentAnswer?.toString() || ''}
            onChangeText={(text) => handleAnswer(Number(text) || 0)}
          />
          {currentAnswer && (
            <Text style={styles.conversionText}>
              {currentAnswer} cm ({Math.floor(currentAnswer / 30.48)}'{Math.round(((currentAnswer / 30.48) % 1) * 12)}")
            </Text>
          )}
        </View>
      );
    }
  };

  const renderNumberWithUnits = () => {
    const isWeight = questions[currentStep].id === 'weight' || questions[currentStep].id === 'targetWeight';
    const currentUnit = isWeight ? units.weight : units.height;
    const unitOptions = questions[currentStep].units || [];

    return (
      <View style={styles.unitInputContainer}>
        <View style={styles.unitSelector}>
          {unitOptions.map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.unitButton, currentUnit === unit && styles.unitButtonActive]}
              onPress={() => handleUnitChange(isWeight ? 'weight' : 'height', unit)}
            >
              <Text style={[styles.unitButtonText, currentUnit === unit && styles.unitButtonTextActive]}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.unitInputWrapper}>
          <TextInput
            style={[styles.input, styles.unitInput]}
            placeholder={questions[currentStep].placeholder}
            keyboardType="numeric"
            value={currentAnswer?.toString() || ''}
            onChangeText={(text) => handleAnswer(Number(text) || 0)}
          />
          <Text style={styles.unitLabel}>{currentUnit}</Text>
        </View>
        {currentAnswer && isWeight && (
          <Text style={styles.conversionText}>
            {units.weight === 'lbs' 
              ? `${currentAnswer} lbs (${(currentAnswer * 0.453592).toFixed(1)} kg)`
              : `${currentAnswer} kg (${(currentAnswer / 0.453592).toFixed(1)} lbs)`
            }
          </Text>
        )}
      </View>
    );
  };

  // Welcome Screen
  if (showWelcome) {
    return (
      <SafeAreaView style={styles.welcomeContainer} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.welcomeContent} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeLogo}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>✨</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome to BloomYou!</Text>
            <Text style={styles.welcomeSubtitle}>
              Let's personalize your fitness journey with a few quick questions
            </Text>
          </View>

          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>📷</Text>
              <Text style={styles.featureTitle}>AI Food Recognition</Text>
              <Text style={styles.featureText}>Snap photos of your meals for instant nutrition tracking</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🏋️</Text>
              <Text style={styles.featureTitle}>Smart Workouts</Text>
              <Text style={styles.featureText}>Track exercises and get personalized recommendations</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>📊</Text>
              <Text style={styles.featureTitle}>Progress Insights</Text>
              <Text style={styles.featureText}>Monitor your health and fitness journey with data</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => setShowWelcome(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={skipOnboarding}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Skip Button */}
      <View style={styles.skipButtonContainer}>
        <TouchableOpacity
          style={styles.skipButtonTop}
          onPress={skipOnboarding}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-forward" size={16} color="#64748b" />
          <Text style={styles.skipButtonTopText}>Skip Setup</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {currentStep + 1} of {questions.length}
            </Text>
            <View style={styles.progressPercentage}>
              <Ionicons name="sparkles" size={16} color="#2563eb" />
              <Text style={styles.progressPercentageText}>
                {Math.round(((currentStep + 1) / questions.length) * 100)}%
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / questions.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>
            {questions[currentStep].question}
          </Text>
          
          {questions[currentStep].subtitle && (
            <Text style={styles.questionSubtitle}>
              {questions[currentStep].subtitle}
            </Text>
          )}

          {questions[currentStep].type === 'text' && (
            <TextInput
              style={styles.input}
              placeholder={questions[currentStep].placeholder}
              value={currentAnswer || ''}
              onChangeText={handleAnswer}
              autoFocus
            />
          )}

          {questions[currentStep].type === 'number' && (
            <TextInput
              style={styles.input}
              placeholder={questions[currentStep].placeholder}
              keyboardType="numeric"
              value={currentAnswer?.toString() || ''}
              onChangeText={(text) => handleAnswer(Number(text) || 0)}
              autoFocus
            />
          )}

          {questions[currentStep].type === 'number_with_units' && renderNumberWithUnits()}

          {questions[currentStep].type === 'height_input' && renderHeightInput()}

          {questions[currentStep].type === 'select' && (
            <View style={styles.optionsContainer}>
              {questions[currentStep].options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    currentAnswer === option && styles.optionButtonSelected
                  ]}
                  onPress={() => handleAnswer(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    currentAnswer === option && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {questions[currentStep].type === 'select_with_info' && (
            <View style={styles.optionsContainer}>
              {questions[currentStep].options?.map((option) => (
                <View key={option} style={styles.optionWithInfo}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      styles.optionButtonWithInfo,
                      currentAnswer === option && styles.optionButtonSelected
                    ]}
                    onPress={() => handleAnswer(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      currentAnswer === option && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => showInfo(option)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="information-circle" size={20} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {questions[currentStep].type === 'multiselect' && (
            <View style={styles.optionsContainer}>
              {questions[currentStep].options?.map((option) => {
                const isSelected = (currentAnswer || []).includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      const current = currentAnswer || [];
                      const updated = current.includes(option)
                        ? current.filter((item: string) => item !== option)
                        : [...current, option];
                      handleAnswer(updated);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.multiselectContent}>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressIndicator}>
          <Text style={styles.progressIndicatorText}>
            {currentStep < questions.length - 1 
              ? `${questions.length - currentStep - 1} questions remaining`
              : 'Ready to start your journey!'
            }
          </Text>
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={prevStep}
          disabled={currentStep === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={currentStep === 0 ? '#94a3b8' : '#64748b'} />
          <Text style={[styles.backButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, !canProceed && styles.navButtonDisabled]}
          onPress={nextStep}
          disabled={!canProceed}
          activeOpacity={0.7}
        >
          <Text style={[styles.nextButtonText, !canProceed && styles.navButtonTextDisabled]}>
            {currentStep === questions.length - 1 ? 'Complete Setup' : 'Next'}
          </Text>
          {currentStep === questions.length - 1 ? (
            <Ionicons name="sparkles" size={20} color={canProceed ? '#ffffff' : '#94a3b8'} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={canProceed ? '#ffffff' : '#94a3b8'} />
          )}
        </TouchableOpacity>
      </View>

      {/* Info Modal */}
      <Modal visible={showInfoModal} animationType="fade" transparent onRequestClose={() => setShowInfoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{infoContent.title}</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>{infoContent.description}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowInfoModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebf2fe',
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#ebf2fe',
  },
  welcomeContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeLogo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  featuresGrid: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  skipButtonContainer: {
    position: 'absolute',
    top: 12,
    right: 24,
    zIndex: 10,
  },
  skipButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipButtonTopText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
  },
  progressPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressPercentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  unitInputContainer: {
    gap: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#2563eb',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  unitButtonTextActive: {
    color: '#ffffff',
  },
  unitInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingRight: 16,
  },
  unitInput: {
    flex: 1,
    borderWidth: 0,
    paddingRight: 8,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  heightInputContainer: {
    gap: 16,
  },
  heightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heightInputGroup: {
    flex: 1,
  },
  heightInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  heightInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  conversionText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    width: '100%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionButtonWithInfo: {
    paddingRight: 48,
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  optionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  optionWithInfo: {
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  multiselectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  progressIndicatorText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: '#ebf2fe',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  backButton: {
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    marginLeft: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonTextDisabled: {
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
