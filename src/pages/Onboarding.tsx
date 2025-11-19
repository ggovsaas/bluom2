import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Sparkles, Scale, Ruler, Info, X, SkipForward } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [units, setUnits] = useState({
    weight: 'lbs', // lbs or kg
    height: 'ft' // ft or cm
  });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', description: '' });
  const [showWelcome, setShowWelcome] = useState(true);
  const { updateProfile } = useUser();

  // Nutrition approach information
  const nutritionInfo = {
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

  const questions = [
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
      options: ['Sedentary (desk job, little exercise)', 'Lightly Active (light exercise 1-3 days/week)', 'Moderately Active (moderate exercise 3-5 days/week)', 'Very Active (hard exercise 6-7 days/week)', 'Extremely Active (very hard exercise, physical job)'],
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
    const info = nutritionInfo[option as keyof typeof nutritionInfo];
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

  const completeOnboarding = () => {
    // Convert units to metric for calculations
    const weightInKg = units.weight === 'kg' ? answers.weight : answers.weight * 0.453592;
    const heightInCm = units.height === 'cm' ? answers.height : 
      (Math.floor(answers.height) * 30.48) + ((answers.height % 1) * 12 * 2.54);

    // Enhanced BMR calculation using Mifflin-St Jeor Equation
    const bmr = calculateBMR(weightInKg, heightInCm, answers.age, answers.gender);
    
    // Activity factor based on detailed activity level
    const activityMultiplier = getActivityMultiplier(answers.activityLevel);
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityMultiplier;
    
    // Adjust calories based on goal with more nuanced approach
    const dailyCalories = adjustCaloriesForGoal(tdee, answers.fitnessGoal, answers.targetWeight, weightInKg);
    
    // Calculate macros based on nutrition preference and goal
    const macros = calculateMacros(dailyCalories, answers.nutritionPreference, answers.fitnessGoal);
    
    const profile = {
      ...answers,
      weight: answers.weight, // Keep original unit value
      height: answers.height, // Keep original unit value
      weightUnit: units.weight,
      heightUnit: units.height,
      weightInKg, // Store metric for calculations
      heightInCm, // Store metric for calculations
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
    localStorage.setItem('aifit_onboarding_completed', 'true');
    navigate('/signup');
  };

  const skipOnboarding = () => {
    // Set default values for a quick start
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
      timeAvailable: '30-45 minutes',
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
    localStorage.setItem('aifit_onboarding_completed', 'true');
    navigate('/signup');
  };

  const calculateBMR = (weightKg: number, heightCm: number, age: number, gender: string) => {
    // Mifflin-St Jeor Equation - more accurate than Harris-Benedict
    if (gender.toLowerCase() === 'male') {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
  };

  const getActivityMultiplier = (activityLevel: string) => {
    const multipliers = {
      'Sedentary (desk job, little exercise)': 1.2,
      'Lightly Active (light exercise 1-3 days/week)': 1.375,
      'Moderately Active (moderate exercise 3-5 days/week)': 1.55,
      'Very Active (hard exercise 6-7 days/week)': 1.725,
      'Extremely Active (very hard exercise, physical job)': 1.9
    };
    return multipliers[activityLevel as keyof typeof multipliers] || 1.2;
  };

  const adjustCaloriesForGoal = (tdee: number, goal: string, targetWeight?: number, currentWeight?: number) => {
    let calories = tdee;
    
    switch (goal) {
      case 'Lose Weight':
        // More aggressive deficit for higher starting weights
        const deficitPercentage = currentWeight && currentWeight > 90 ? 0.25 : 0.20; // 20-25% deficit
        calories = tdee * (1 - deficitPercentage);
        break;
      case 'Build Muscle':
        // Moderate surplus for muscle building
        calories = tdee * 1.15; // 15% surplus
        break;
      case 'Maintain Weight':
        calories = tdee;
        break;
      case 'Improve Endurance':
        // Slight surplus to fuel training
        calories = tdee * 1.05; // 5% surplus
        break;
      case 'General Health':
        calories = tdee;
        break;
    }

    // Ensure minimum calories for health (never below BMR * 1.1)
    const minimumCalories = (tdee / getActivityMultiplier(answers.activityLevel || 'Sedentary')) * 1.1;
    return Math.max(calories, minimumCalories);
  };

  const calculateMacros = (calories: number, nutritionPreference: string, fitnessGoal: string) => {
    let proteinRatio = 0.25; // Default 25%
    let fatRatio = 0.25; // Default 25%
    let carbRatio = 0.50; // Default 50%

    // Adjust based on nutrition preference
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

    // Adjust based on fitness goal
    if (fitnessGoal === 'Build Muscle') {
      proteinRatio = Math.max(proteinRatio, 0.30); // Ensure at least 30% protein
    }

    return {
      protein: (calories * proteinRatio) / 4, // 4 calories per gram
      carbs: (calories * carbRatio) / 4, // 4 calories per gram
      fat: (calories * fatRatio) / 9, // 9 calories per gram
    };
  };

  const currentAnswer = answers[questions[currentStep].id];
  const canProceed = currentAnswer !== undefined && currentAnswer !== '' && 
    (questions[currentStep].type !== 'multiselect' || 
     (Array.isArray(currentAnswer) && currentAnswer.length > 0));

  const renderHeightInput = () => {
    if (units.height === 'ft') {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => handleUnitChange('height', 'ft')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                units.height === 'ft' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              Feet & Inches
            </button>
            <button
              onClick={() => handleUnitChange('height', 'cm')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                units.height === 'cm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              Centimeters
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Feet</label>
              <input
                type="number"
                placeholder="5"
                min="3"
                max="8"
                value={Math.floor(currentAnswer || 0)}
                onChange={(e) => {
                  const feet = parseInt(e.target.value) || 0;
                  const inches = ((currentAnswer || 0) % 1) * 12;
                  handleAnswer(feet + inches / 12);
                }}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inches</label>
              <input
                type="number"
                placeholder="8"
                min="0"
                max="11"
                value={Math.round(((currentAnswer || 0) % 1) * 12)}
                onChange={(e) => {
                  const feet = Math.floor(currentAnswer || 0);
                  const inches = parseInt(e.target.value) || 0;
                  handleAnswer(feet + inches / 12);
                }}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>
          </div>
          {currentAnswer && (
            <p className="text-sm text-gray-600 text-center">
              {Math.floor(currentAnswer)}'{Math.round(((currentAnswer % 1) * 12))}" 
              ({Math.round((Math.floor(currentAnswer) * 30.48) + (((currentAnswer % 1) * 12) * 2.54))} cm)
            </p>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => handleUnitChange('height', 'ft')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                units.height === 'ft' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              Feet & Inches
            </button>
            <button
              onClick={() => handleUnitChange('height', 'cm')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                units.height === 'cm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              Centimeters
            </button>
          </div>
          <input
            type="number"
            placeholder="170"
            min="120"
            max="250"
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(Number(e.target.value))}
            className="w-full p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
          />
          {currentAnswer && (
            <p className="text-sm text-gray-600 text-center">
              {currentAnswer} cm ({Math.floor(currentAnswer / 30.48)}'{Math.round(((currentAnswer / 30.48) % 1) * 12)}")
            </p>
          )}
        </div>
      );
    }
  };

  const renderNumberWithUnits = () => {
    const isWeight = questions[currentStep].id === 'weight' || questions[currentStep].id === 'targetWeight';
    const currentUnit = isWeight ? units.weight : units.height;
    const unitOptions = questions[currentStep].units || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          {unitOptions.map((unit) => (
            <button
              key={unit}
              onClick={() => handleUnitChange(isWeight ? 'weight' : 'height', unit)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentUnit === unit ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            placeholder={questions[currentStep].placeholder}
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(Number(e.target.value))}
            className="w-full p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg pr-16"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
            {currentUnit}
          </span>
        </div>
        {currentAnswer && isWeight && (
          <p className="text-sm text-gray-600 text-center">
            {units.weight === 'lbs' 
              ? `${currentAnswer} lbs (${(currentAnswer * 0.453592).toFixed(1)} kg)`
              : `${currentAnswer} kg (${(currentAnswer / 0.453592).toFixed(1)} lbs)`
            }
          </p>
        )}
      </div>
    );
  };

  // Welcome slider
  if (showWelcome) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">✨</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to BloomYou!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Let's personalize your fitness journey with a few quick questions
            </p>
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl mb-4">📷</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Food Recognition</h3>
              <p className="text-gray-600 text-sm">Snap photos of your meals for instant nutrition tracking</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl mb-4">🏋️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Workouts</h3>
              <p className="text-gray-600 text-sm">Track exercises and get personalized recommendations</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Insights</h3>
              <p className="text-gray-600 text-sm">Monitor your health and fitness journey with data</p>
            </div>
          </div>

          {/* Get Started Button */}
          <motion.button
            onClick={() => setShowWelcome(false)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started →
          </motion.button>

          {/* Skip option */}
          <button
            onClick={skipOnboarding}
            className="mt-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Skip Button */}
      <button
        onClick={skipOnboarding}
        className="absolute top-6 right-6 flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-all z-10"
      >
        <SkipForward size={16} className="mr-2" />
        Skip Setup
      </button>

      <div className="w-full max-w-md">
        {/* Enhanced Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {currentStep + 1} of {questions.length}
            </span>
            <div className="flex items-center space-x-1">
              <Sparkles className="text-blue-600" size={16} />
              <span className="text-sm font-medium text-blue-600">
                {Math.round(((currentStep + 1) / questions.length) * 100)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Enhanced Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl p-8 shadow-xl mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {questions[currentStep].question}
            </h2>
            
            {questions[currentStep].subtitle && (
              <p className="text-sm text-gray-600 mb-6">
                {questions[currentStep].subtitle}
              </p>
            )}

            {questions[currentStep].type === 'text' && (
              <input
                type="text"
                placeholder={questions[currentStep].placeholder}
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            )}

            {questions[currentStep].type === 'number' && (
              <input
                type="number"
                placeholder={questions[currentStep].placeholder}
                min={questions[currentStep].min}
                max={questions[currentStep].max}
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(Number(e.target.value))}
                className="w-full p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            )}

            {questions[currentStep].type === 'number_with_units' && renderNumberWithUnits()}

            {questions[currentStep].type === 'height_input' && renderHeightInput()}

            {questions[currentStep].type === 'select' && (
              <div className="space-y-3">
                {questions[currentStep].options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      currentAnswer === option
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {questions[currentStep].type === 'select_with_info' && (
              <div className="space-y-3">
                {questions[currentStep].options?.map((option) => (
                  <div key={option} className="relative">
                    <button
                      onClick={() => handleAnswer(option)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all pr-12 ${
                        currentAnswer === option
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                    <button
                      onClick={() => showInfo(option)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                    >
                      <Info size={16} className="text-blue-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {questions[currentStep].type === 'multiselect' && (
              <div className="space-y-3">
                {questions[currentStep].options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      const current = currentAnswer || [];
                      const updated = current.includes(option)
                        ? current.filter((item: string) => item !== option)
                        : [...current, option];
                      handleAnswer(updated);
                    }}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      (currentAnswer || []).includes(option)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {(currentAnswer || []).includes(option) && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={20} className="mr-1" />
            Back
          </button>

          <button
            onClick={nextStep}
            disabled={!canProceed}
            className={`flex items-center px-8 py-3 rounded-xl font-medium transition-all ${
              canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {currentStep === questions.length - 1 ? (
              <>
                Complete Setup
                <Sparkles size={20} className="ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight size={20} className="ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {currentStep < questions.length - 1 
              ? `${questions.length - currentStep - 1} questions remaining`
              : 'Ready to start your journey!'
            }
          </p>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">{infoContent.title}</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>
            <p className="text-gray-600 leading-relaxed">{infoContent.description}</p>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Onboarding;