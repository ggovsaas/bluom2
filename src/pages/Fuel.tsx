import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Droplets, 
  Target,
  Calendar,
  Camera,
  ChefHat,
  Crown,
  Sunrise,
  Sun,
  Sunset,
  Cookie,
  X,
  Trash2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Apple,
  Beef,
  Fish,
  Carrot,
  Milk,
  Egg,
  Coffee,
  Edit3,
  Save,
  RotateCcw,
  Info
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { PieChart as MacroPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import MacroChart, { MacroChartMode } from '../components/MacroChart';

// Add at the top, after imports
const DEFAULT_IMAGE = 'https://cdn.pixabay.com/photo/2017/01/20/15/06/food-1995056_1280.png';

const Fuel = () => {
  const navigate = useNavigate();
  const { 
    profile, 
    dailyData, 
    updateDailyData, 
    addFoodEntry, 
    getFoodEntriesForMeal, 
    getUsedDays,
    getCurrentDate,
    removeFoodEntry
  } = useUser();
  
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showLogRecipeModal, setShowLogRecipeModal] = useState(false);
  const [createdRecipe, setCreatedRecipe] = useState<any>(null);
  const [logMeal, setLogMeal] = useState('Lunch');
  const [logQuantity, setLogQuantity] = useState(1);
  const [logSuccess, setLogSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customMeals, setCustomMeals] = useState<string[]>([]);
  const [waterAmount, setWaterAmount] = useState('');
  const [waterUnit, setWaterUnit] = useState('8oz');
  const [swipingEntry, setSwipingEntry] = useState<string | null>(null);
  
  // Recipe form state
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    servings: 1,
    ingredients: [] as any[]
  });
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientResults, setIngredientResults] = useState<any[]>([]);
  
  // Photo recognition state
  const [recognizedFood, setRecognizedFood] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Water unit options
  const waterUnits = [
    { value: '8oz', label: '8 fl oz', ml: 237 },
    { value: '500ml', label: '500 ml', ml: 500 },
    { value: '1cup', label: '1 cup (250ml)', ml: 250 }
  ];

  // Meal configurations with beautiful icons
  const mealConfigs = {
    'Breakfast': { icon: Sunrise, color: 'bg-orange-100', iconColor: 'text-orange-600' },
    'Lunch': { icon: Sun, color: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    'Dinner': { icon: Sunset, color: 'bg-purple-100', iconColor: 'text-purple-600' },
    'Snack': { icon: Cookie, color: 'bg-pink-100', iconColor: 'text-pink-600' }
  };

  const defaultMeals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const allMeals = [...defaultMeals, ...customMeals];

  const usedDays = getUsedDays();
  const currentDate = getCurrentDate();

  // Add state for selectedDate
  const [selectedDate, setSelectedDate] = useState(currentDate);

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push({
        day: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        date: date.getDate(),
        fullDate: date.toISOString().split('T')[0],
        isToday: date.toISOString().split('T')[0] === currentDate
      });
    }
    return weekDates;
  };

  const weekDates = getCurrentWeekDates();

  // Calculate totals for today from food entries
  const todayEntries = getFoodEntriesForMeal('', selectedDate);
  const todayTotals = todayEntries.reduce((total, entry) => ({
    calories: total.calories + (entry.calories * entry.quantity),
    protein: total.protein + (entry.protein * entry.quantity),
    carbs: total.carbs + (entry.carbs * entry.quantity),
    fat: total.fat + (entry.fat * entry.quantity)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const remaining = {
    calories: Math.max(0, (profile?.dailyCalories || 2000) - todayTotals.calories),
    protein: Math.max(0, (profile?.dailyProtein || 150) - todayTotals.protein),
    carbs: Math.max(0, (profile?.dailyCarbs || 225) - todayTotals.carbs),
    fat: Math.max(0, (profile?.dailyFat || 67) - todayTotals.fat)
  };

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(50);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Food search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchIngredients = async (query: string) => {
    if (!query.trim()) {
      setIngredientResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(50);
      
      if (error) throw error;
      setIngredientResults(data || []);
    } catch (error) {
      console.error('Ingredient search error:', error);
      setIngredientResults([]);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchFoods(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (ingredientSearch) {
        searchIngredients(ingredientSearch);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [ingredientSearch]);

  const addFood = (food: any, meal: string) => {
    // Use perServing macros if available
    const nutrition = food.nutrition?.perServing || food.nutrition || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0
    };
    const entry: any = {
      id: `${Date.now()}-${Math.random()}`,
      foodId: food.id,
      name: food.name,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      quantity: 1,
      meal,
      date: currentDate,
      nutrition // Pass full nutrition object for backend
    };
    addFoodEntry(entry);
    setShowFoodSearch(false);
    setSearchQuery('');
    setSelectedMeal(null);
  };

  const handleSwipeDelete = (entryId: string) => {
    setSwipingEntry(entryId);
    setTimeout(() => {
      removeFoodEntry(entryId);
      setSwipingEntry(null);
    }, 300);
  };

  const addCustomMeal = () => {
    if (!profile?.isPremium) {
      // Navigate to premium page instead of showing alert
      navigate('/premium');
      return;
    }
    
    const mealName = prompt('Enter meal name:');
    if (mealName && !allMeals.includes(mealName)) {
      setCustomMeals([...customMeals, mealName]);
    }
  };

  const getMealTotals = (meal: string) => {
    return getFoodEntriesForMeal(meal, selectedDate).reduce((total, entry) => {
      const nutrition = entry.nutrition || entry;
      return {
        calories: total.calories + (nutrition.calories || 0) * entry.quantity,
        protein: total.protein + (nutrition.protein || 0) * entry.quantity,
        carbs: total.carbs + (nutrition.carbs || 0) * entry.quantity,
        fat: total.fat + (nutrition.fat || 0) * entry.quantity
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const addWater = () => {
    if (!waterAmount) return;
    
    const selectedUnit = waterUnits.find(unit => unit.value === waterUnit);
    const mlAmount = selectedUnit ? selectedUnit.ml * parseFloat(waterAmount) : 237;
    const ozAmount = mlAmount / 29.5735; // Convert ml to oz
    
    updateDailyData({ water: dailyData.water + ozAmount });
    setWaterAmount('');
    setShowWaterModal(false);
  };

  // AI Photo Recognition
  const handlePhotoRecognition = async () => {
    try {
      setIsProcessing(true);
      setRecognitionError(null);
      
      if (!capturedImage) {
        setRecognitionError('No image captured. Please take a photo first.');
        return;
      }

      // Convert base64 image to blob for API
      const base64Data = capturedImage.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('image', blob, 'food.jpg');
      
      // Food recognition - upload to Supabase storage and process
      // For now, skip recognition and let user search manually
      // TODO: Implement food recognition via Supabase Edge Function or external API
      const response = { data: { success: false, message: 'Food recognition not available' } };
      
      if (response.data.success) {
        setRecognizedFood(response.data.recognized_food);
      } else {
        setRecognitionError(response.data.message || 'Failed to recognize food');
      }
    } catch (error) {
      console.error('Photo recognition error:', error);
      setRecognitionError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addRecognizedFood = (meal: string) => {
    if (recognizedFood) {
      addFood(recognizedFood, meal);
      setRecognizedFood(null);
      setShowPhotoCapture(false);
    }
  };

  const captureImage = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.getElementById('camera-canvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    
    if (video && canvas && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      const video = document.getElementById('camera-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setRecognitionError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Recipe Management
  const addIngredientToRecipe = (ingredient: any) => {
    const newIngredient = {
      ...ingredient,
      quantity: 1
    };
    setRecipeForm({
      ...recipeForm,
      ingredients: [...recipeForm.ingredients, newIngredient]
    });
    setIngredientSearch('');
    setIngredientResults([]);
  };

  const removeIngredientFromRecipe = (index: number) => {
    const updatedIngredients = recipeForm.ingredients.filter((_, i) => i !== index);
    setRecipeForm({ ...recipeForm, ingredients: updatedIngredients });
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updatedIngredients = [...recipeForm.ingredients];
    updatedIngredients[index].quantity = quantity;
    setRecipeForm({ ...recipeForm, ingredients: updatedIngredients });
  };

  const createRecipe = async () => {
    if (!recipeForm.name || recipeForm.ingredients.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipeForm)
        .select()
        .single();
      
      if (!error && data) {
        const recipe = data;
        // Show log recipe modal
        setCreatedRecipe(recipe);
        setShowLogRecipeModal(true);
        setLogMeal('Lunch');
        setLogQuantity(1);
        setLogSuccess(false);
        
        // Reset form
        setRecipeForm({ name: '', servings: 1, ingredients: [] });
        setShowRecipeModal(false);
      }
    } catch (error) {
      console.error('Recipe creation error:', error);
    }
  };

  const handleLogRecipe = () => {
    if (!createdRecipe) return;
    addFood(createdRecipe, logMeal);
    setLogSuccess(true);
    setTimeout(() => {
      setShowLogRecipeModal(false);
      setCreatedRecipe(null);
      setLogMeal('Lunch');
      setLogQuantity(1);
      setLogSuccess(false);
    }, 1500);
  };

  // Enhanced Pie chart component
  const PieChart = ({ value, max, color, size = 80 }: { value: number, max: number, color: string, size?: number }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * 22;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r="22"
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r="22"
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-800">{Math.round(value)}</span>
        </div>
      </div>
    );
  };

  const getMealIcon = (mealName: string) => {
    const config = mealConfigs[mealName as keyof typeof mealConfigs];
    if (config) {
      return config;
    }
    // Default for custom meals
    return { icon: Target, color: 'bg-blue-100', iconColor: 'text-blue-600' };
  };

  const [showRecipeMenu, setShowRecipeMenu] = useState(false);

  // 1. Add state for AddFoodModal
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);

  // Add state for plus button menu
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const menu = document.getElementById('plus-menu');
      if (menu && !menu.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
    }
    if (showPlusMenu) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPlusMenu]);

  // Add state for recipe detail modal and selected recipe in Fuel
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logRecipe, setLogRecipe] = useState<any>(null);

  // Camera management
  useEffect(() => {
    if (showPhotoCapture && !capturedImage) {
      startCamera();
    }
    
    return () => {
      if (!showPhotoCapture) {
        stopCamera();
      }
    };
  }, [showPhotoCapture, capturedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fuel</h1>
            <p className="text-gray-600">Track your nutrition & hydration</p>
          </div>
          <div className="flex space-x-2 relative">
            <button
              onClick={() => setShowPlusMenu((v) => !v)}
              className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={24} />
            </button>
            {showPlusMenu && (
              <div id="plus-menu" className="absolute right-0 top-14 bg-white rounded-xl shadow-lg p-2 z-50 w-56 flex flex-col space-y-2">
            <button
              onClick={() => {
                    setShowPlusMenu(false);
                    setShowFoodSearch(true);
              }}
                  className="w-full py-2 px-3 text-left rounded-lg hover:bg-blue-50 text-gray-800"
            >
                  Search Foods
            </button>
            <button
                  onClick={() => {
                    setShowPlusMenu(false);
                    setShowAddFoodModal(true);
                  }}
                  className="w-full py-2 px-3 text-left rounded-lg hover:bg-blue-50 text-gray-800"
                >
                  Add Food/Ingredient
            </button>
            <button
                  onClick={() => {
                    setShowPlusMenu(false);
                    setShowRecipeModal(true);
                  }}
                  className="w-full py-2 px-3 text-left rounded-lg hover:bg-blue-50 text-gray-800"
                >
                  Create Recipe
                </button>
                <button
                  onClick={() => {
                    setShowPlusMenu(false);
                    navigate('/recipes');
                  }}
                  className="w-full py-2 px-3 text-left rounded-lg hover:bg-blue-50 text-gray-800"
                >
                  Browse Recipes
            </button>
                <button
                  onClick={() => {
                    setShowPlusMenu(false);
                    navigate('/my-recipes');
                  }}
                  className="w-full py-2 px-3 text-left rounded-lg hover:bg-blue-50 text-gray-800"
                >
                  My Recipes
                </button>
                <button
                  onClick={() => {
                    setShowPlusMenu(false);
                    setShowPhotoCapture(true);
                  }}
                  className="w-full py-2 px-3 text-left rounded-lg hover:bg-blue-50 text-gray-800"
                >
                  Photo Calorie Detector
            </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Fixed Weekly Calendar - Perfect Vertical Alignment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">This Week</h3>
            <Calendar className="text-blue-600" size={24} />
          </div>

          {/* Fixed 3-row layout with perfect vertical alignment */}
          <div className="space-y-3">
            {/* Row 1: Day names */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDates.map((day, index) => (
                <div key={`day-${index}`} className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{day.day}</p>
                </div>
              ))}
            </div>

            {/* Row 2: Day numbers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDates.map((day, index) => (
                <div key={`date-${index}`} className="text-center">
                  <button
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium mx-auto transition-all
                      ${day.fullDate === selectedDate ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setSelectedDate(day.fullDate)}
                  >
                    {day.date}
                  </button>
                </div>
              ))}
            </div>

            {/* Row 3: Usage dots */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDates.map((day, index) => (
                <div key={`dot-${index}`} className="text-center">
                  <div className="flex justify-center">
                    {usedDays.includes(day.fullDate) ? (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full shadow-sm" 
                      />
                    ) : (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-200 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Macro Dashboard - Using Food Entry Totals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Today's Nutrition</h3>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center">
              <PieChart 
                value={todayTotals.calories} 
                max={profile?.dailyCalories || 2000} 
                color="#3b82f6" 
                size={80}
              />
              <p className="text-sm font-medium text-gray-800 mt-2">Calories</p>
              <p className="text-xs text-gray-500">{remaining.calories} left</p>
            </div>

            <div className="flex flex-col items-center">
              <PieChart 
                value={todayTotals.protein} 
                max={profile?.dailyProtein || 150} 
                color="#ef4444" 
                size={80}
              />
              <p className="text-sm font-medium text-gray-800 mt-2">Protein</p>
              <p className="text-xs text-gray-500">{Math.round(remaining.protein)}g left</p>
            </div>

            <div className="flex flex-col items-center">
              <PieChart 
                value={todayTotals.carbs} 
                max={profile?.dailyCarbs || 225} 
                color="#3b82f6" 
                size={80}
              />
              <p className="text-sm font-medium text-gray-800 mt-2">Carbs</p>
              <p className="text-xs text-gray-500">{Math.round(remaining.carbs)}g left</p>
            </div>

            <div className="flex flex-col items-center">
              <PieChart 
                value={todayTotals.fat} 
                max={profile?.dailyFat || 67} 
                color="#eab308" 
                size={80}
              />
              <p className="text-sm font-medium text-gray-800 mt-2">Fat</p>
              <p className="text-xs text-gray-500">{Math.round(remaining.fat)}g left</p>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Water Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Droplets className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Water</h3>
                <p className="text-sm text-gray-600">{Math.round(dailyData.water)}oz of 64oz</p>
              </div>
            </div>
            <button
              onClick={() => setShowWaterModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Add Water
            </button>
          </div>

          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((glass) => (
              <motion.div
                key={glass}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: glass <= Math.floor(dailyData.water / 8) ? 1 : 0.8,
                  backgroundColor: glass <= Math.floor(dailyData.water / 8) ? '#3b82f6' : '#e5e7eb'
                }}
                transition={{ duration: 0.3, delay: glass * 0.1 }}
                className="flex-1 h-3 rounded-full"
              />
            ))}
          </div>
        </motion.div>

        {/* Enhanced Meals Section with Swipe to Delete */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-6"
        >
          {allMeals.map((meal) => {
            const mealTotals = getMealTotals(meal);
            const mealConfig = getMealIcon(meal);
            const MealIcon = mealConfig.icon;
            
            return (
              <motion.div 
                key={meal} 
                className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${mealConfig.color} rounded-xl flex items-center justify-center`}>
                      <MealIcon className={mealConfig.iconColor} size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{meal}</h4>
                      <p className="text-sm text-gray-600">
                        {Math.round(mealTotals.calories)} cal • {Math.round(mealTotals.protein)}g protein • {Math.round(mealTotals.carbs)}g carbs • {Math.round(mealTotals.fat)}g fat
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMeal(meal);
                      setShowFoodSearch(true);
                    }}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors group"
                  >
                    <Plus size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </button>
                </div>

                {getFoodEntriesForMeal(meal, selectedDate).length > 0 && (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {getFoodEntriesForMeal(meal, selectedDate).map((entry) => {
                        const nutrition = entry.nutrition || entry;
                        return (
                        <motion.div 
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ 
                            opacity: swipingEntry === entry.id ? 0 : 1, 
                            x: swipingEntry === entry.id ? -100 : 0 
                          }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.3 }}
                          className="relative"
                        >
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{entry.name}</p>
                              <p className="text-xs text-gray-600">
                                  {entry.quantity}x • {Math.round((nutrition.calories || 0) * entry.quantity)} cal
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right text-xs text-gray-600">
                                  <p>{Math.round((nutrition.protein || 0) * entry.quantity)}g protein</p>
                                  <p>{Math.round((nutrition.carbs || 0) * entry.quantity)}g carbs</p>
                                  <p>{Math.round((nutrition.fat || 0) * entry.quantity)}g fat</p>
                              </div>
                              <button
                                onClick={() => handleSwipeDelete(entry.id)}
                                className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-200"
                              >
                                <Trash2 size={14} className="text-red-600" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}

                {getFoodEntriesForMeal(meal, selectedDate).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No foods logged yet</p>
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Enhanced Add Meal Button */}
          <motion.button
            onClick={addCustomMeal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white rounded-2xl p-4 shadow-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all flex items-center justify-center space-x-2 group"
          >
            <Plus size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
            <span className="text-gray-600 font-medium group-hover:text-blue-600 transition-colors">Add Meal</span>
            {!profile?.isPremium && <Crown size={16} className="text-yellow-500" />}
          </motion.button>
        </motion.div>
      </div>

      {/* Enhanced Water Modal */}
      {showWaterModal && (
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Water</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="1"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <div className="grid grid-cols-3 gap-2">
                  {waterUnits.map((unit) => (
                    <button
                      key={unit.value}
                      onClick={() => setWaterUnit(unit.value)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        waterUnit === unit.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {waterAmount && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Adding: {waterAmount} × {waterUnits.find(u => u.value === waterUnit)?.label} = {Math.round((waterUnits.find(u => u.value === waterUnit)?.ml || 237) * parseFloat(waterAmount) / 29.5735)} fl oz
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowWaterModal(false);
                  setWaterAmount('');
                }}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addWater}
                disabled={!waterAmount}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-300"
              >
                Add Water
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Enhanced Food Search Modal with tabs */}
      {showFoodSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            className="bg-white w-full h-3/4 rounded-t-2xl p-6"
          >
            <FoodSearchTabs
              selectedMeal={selectedMeal}
              onClose={() => {
                  setShowFoodSearch(false);
                  setSearchQuery('');
                  setSelectedMeal(null);
                }}
              addFood={addFood}
              setShowRecipeModal={setShowRecipeModal}
              setSelectedRecipeDetail={setSelectedRecipeDetail}
              setShowRecipeDetail={setShowRecipeDetail}
              setLogRecipe={setLogRecipe}
              setShowLogModal={setShowLogModal}
              setLogMeal={setLogMeal}
              setLogQuantity={setLogQuantity}
              setLogSuccess={setLogSuccess}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Enhanced Photo Capture Modal with AI Recognition */}
      {showPhotoCapture && (
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
              <h3 className="text-xl font-bold text-gray-800">AI Food Recognition</h3>
              <button
                onClick={() => {
                  stopCamera();
                  setShowPhotoCapture(false);
                  setRecognizedFood(null);
                  setCapturedImage(null);
                  setRecognitionError(null);
                }}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>
            
            {recognizedFood ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-green-600" size={32} />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{recognizedFood.name}</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Confidence: {Math.round(recognizedFood.confidence * 100)}%
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    {recognizedFood.calories} cal • {recognizedFood.protein}g protein • {recognizedFood.carbs}g carbs • {recognizedFood.fat}g fat
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{recognizedFood.serving_size}</p>
                </div>
                
                <div className="space-y-2 mb-6">
                  <p className="text-sm font-medium text-gray-700">Add to meal:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultMeals.map((meal) => (
                      <button
                        key={meal}
                        onClick={() => addRecognizedFood(meal)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setRecognizedFood(null);
                    setCapturedImage(null);
                    startCamera();
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-center">
                {!capturedImage ? (
                  <>
                    <div className="relative mb-4">
                      <video
                        id="camera-video"
                        className="w-full h-48 bg-gray-200 rounded-lg object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      <canvas
                        id="camera-canvas"
                        className="hidden"
                      />
                    </div>
                    
                    {recognitionError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-600">{recognitionError}</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={captureImage}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="inline mr-2" size={16} />
                        Capture
                      </button>
                      <button
                        onClick={() => {
                          stopCamera();
                          setShowPhotoCapture(false);
                          setCapturedImage(null);
                          setRecognitionError(null);
                        }}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <img
                        src={capturedImage}
                        alt="Captured food"
                        className="w-full h-48 bg-gray-200 rounded-lg object-cover"
                      />
                    </div>
                    
                    {isProcessing ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Analyzing your food...</p>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={handlePhotoRecognition}
                          className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                        >
                          <Sparkles className="inline mr-2" size={16} />
                          Analyze
                        </button>
                        <button
                          onClick={() => {
                            setCapturedImage(null);
                            startCamera();
                          }}
                          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                          Retake
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Recipe Menu Modal */}
      {showRecipeMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recipes</h3>
              <button
                onClick={() => setShowRecipeMenu(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowRecipeMenu(false);
                  setShowRecipeModal(true);
                }}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
              >
                Create Recipe
              </button>
              <button
                onClick={() => {
                  setShowRecipeMenu(false);
                  navigate('/recipes');
                }}
                className="w-full py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Browse Recipes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add Food Modal */}
      {showAddFoodModal && (
        <AddFoodModal onClose={() => setShowAddFoodModal(false)} />
      )}

      {showRecipeModal && (
        <RecipeModal
          onClose={() => setShowRecipeModal(false)}
          setLogRecipe={setLogRecipe}
          setShowLogModal={setShowLogModal}
          setLogMeal={setLogMeal}
          setLogQuantity={setLogQuantity}
          setLogSuccess={setLogSuccess}
        />
      )}

      {showLogRecipeModal && (
        <LogRecipeModal
          onClose={() => {
            setShowLogRecipeModal(false);
            setCreatedRecipe(null);
            setLogMeal('Lunch');
            setLogQuantity(1);
            setLogSuccess(true);
          }}
          recipe={createdRecipe}
          meal={logMeal}
          quantity={logQuantity}
          onMealChange={(meal) => setLogMeal(meal)}
          onQuantityChange={(quantity) => setLogQuantity(quantity)}
          onSave={handleLogRecipe}
          onCancel={() => {
            setShowLogRecipeModal(false);
            setCreatedRecipe(null);
            setLogMeal('Lunch');
            setLogQuantity(1);
            setLogSuccess(false);
          }}
          onSuccess={logSuccess}
        />
      )}

      {showRecipeDetail && selectedRecipeDetail && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{selectedRecipeDetail.name}</h3>
              <button onClick={() => setShowRecipeDetail(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><span className="text-xl">×</span></button>
            </div>
            <img src={DEFAULT_IMAGE} alt="Recipe" className="w-24 h-24 rounded-lg object-cover mx-auto mb-4" />
            <div className="text-center mb-2 text-gray-700">Servings: {selectedRecipeDetail.servings}</div>
            <div className="flex justify-center space-x-4 mb-4 text-xs text-gray-600">
              <span>Calories: {Math.round(selectedRecipeDetail.nutrition?.calories || 0)}</span>
              <span>Protein: {Math.round(selectedRecipeDetail.nutrition?.protein || 0)}g</span>
              <span>Carbs: {Math.round(selectedRecipeDetail.nutrition?.carbs || 0)}g</span>
              <span>Fat: {Math.round(selectedRecipeDetail.nutrition?.fat || 0)}g</span>
            </div>
            <button onClick={() => { setShowRecipeDetail(false); setLogRecipe(selectedRecipeDetail); setShowLogModal(true); setLogMeal('Lunch'); setLogQuantity(1); setLogSuccess(false); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 mb-2">Log to Meal</button>
            <button onClick={() => setShowRecipeDetail(false)} className="w-full py-2 border border-gray-300 rounded-xl font-medium text-gray-700">Close</button>
          </motion.div>
        </motion.div>
      )}

      {showLogModal && logRecipe && (
        <LogRecipeModal
          onClose={() => { setShowLogModal(false); setLogRecipe(null); setLogMeal('Lunch'); setLogQuantity(1); setLogSuccess(false); }}
          recipe={logRecipe}
          meal={logMeal}
          quantity={logQuantity}
          onMealChange={setLogMeal}
          onQuantityChange={setLogQuantity}
          onSave={() => {
            addFood(logRecipe, logMeal);
            setLogSuccess(true);
            setTimeout(() => {
              setShowLogModal(false);
              setLogRecipe(null);
              setLogMeal('Lunch');
              setLogQuantity(1);
              setLogSuccess(false);
            }, 1200);
          }}
          onCancel={() => { setShowLogModal(false); setLogRecipe(null); setLogMeal('Lunch'); setLogQuantity(1); setLogSuccess(false); }}
          onSuccess={logSuccess}
        />
      )}
    </div>
  );
};

// 4. Add the AddFoodModal implementation (simplified, can be moved to its own file later)
function AddFoodModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    barcode: '',
    servingSize: '100g',
    calories: '',
    totalFat: '',
    saturatedFat: '',
    monounsaturatedFat: '',
    polyunsaturatedFat: '',
    transFat: '',
    totalCarbs: '',
    fiber: '',
    sugar: '',
    protein: '',
    sodium: '',
    cholesterol: '',
    iron: '',
    potassium: '',
    zinc: '',
    vitaminA: '',
    vitaminC: '',
    vitaminD: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const required = ['name', 'calories', 'totalFat', 'totalCarbs', 'protein'];
  const [macroMode, setMacroMode] = useState<MacroChartMode>('perServing');
  const servings = 1; // For single foods, always 1

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Prepare payload with correct types for required fields
      const payload = {
        ...form,
        calories: parseFloat(form.calories),
        totalFat: parseFloat(form.totalFat),
        totalCarbs: parseFloat(form.totalCarbs),
        protein: parseFloat(form.protein),
      };
      const { error } = await supabase
        .from('foods')
        .insert(payload);
      
      if (error) throw error;
      onClose();
      alert('Food/ingredient added!');
    } catch (e) {
      setError('Failed to save.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Add Food / Ingredient</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-xl">×</span>
          </button>
        </div>
        {step === 1 && (
            <div className="space-y-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Food Name*" className="w-full p-3 border border-gray-300 rounded-xl" />
            <input name="brand" value={form.brand} onChange={handleChange} placeholder="Brand (optional)" className="w-full p-3 border border-gray-300 rounded-xl" />
            <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="Barcode (optional)" className="w-full p-3 border border-gray-300 rounded-xl" />
            <select name="servingSize" value={form.servingSize} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl">
              <option value="100g">per 100g</option>
              <option value="100ml">per 100ml</option>
              <option value="1cup">per 1 cup</option>
            </select>
            <button onClick={() => setStep(2)} disabled={!form.name} className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium disabled:bg-gray-300">Next</button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input name="calories" value={form.calories} onChange={handleChange} placeholder="Calories (kcal)*" className="p-2 border border-gray-300 rounded" />
              <input name="totalFat" value={form.totalFat} onChange={handleChange} placeholder="Total Fat (g)*" className="p-2 border border-gray-300 rounded" />
              <input name="saturatedFat" value={form.saturatedFat} onChange={handleChange} placeholder="Saturated Fat (g)" className="p-2 border border-gray-300 rounded" />
              <input name="monounsaturatedFat" value={form.monounsaturatedFat} onChange={handleChange} placeholder="Monounsaturated Fat (g)" className="p-2 border border-gray-300 rounded" />
              <input name="polyunsaturatedFat" value={form.polyunsaturatedFat} onChange={handleChange} placeholder="Polyunsaturated Fat (g)" className="p-2 border border-gray-300 rounded" />
              <input name="transFat" value={form.transFat} onChange={handleChange} placeholder="Trans Fat (g)" className="p-2 border border-gray-300 rounded" />
              <input name="totalCarbs" value={form.totalCarbs} onChange={handleChange} placeholder="Total Carbs (g)*" className="p-2 border border-gray-300 rounded" />
              <input name="fiber" value={form.fiber} onChange={handleChange} placeholder="Fiber (g)" className="p-2 border border-gray-300 rounded" />
              <input name="sugar" value={form.sugar} onChange={handleChange} placeholder="Sugar (g)" className="p-2 border border-gray-300 rounded" />
              <input name="protein" value={form.protein} onChange={handleChange} placeholder="Protein (g)*" className="p-2 border border-gray-300 rounded" />
              <input name="sodium" value={form.sodium} onChange={handleChange} placeholder="Sodium (mg)" className="p-2 border border-gray-300 rounded" />
              <input name="cholesterol" value={form.cholesterol} onChange={handleChange} placeholder="Cholesterol (mg)" className="p-2 border border-gray-300 rounded" />
              <input name="iron" value={form.iron} onChange={handleChange} placeholder="Iron (mg)" className="p-2 border border-gray-300 rounded" />
              <input name="potassium" value={form.potassium} onChange={handleChange} placeholder="Potassium (mg)" className="p-2 border border-gray-300 rounded" />
              <input name="zinc" value={form.zinc} onChange={handleChange} placeholder="Zinc (mg)" className="p-2 border border-gray-300 rounded" />
              <input name="vitaminA" value={form.vitaminA} onChange={handleChange} placeholder="Vitamin A (IU/µg)" className="p-2 border border-gray-300 rounded" />
              <input name="vitaminC" value={form.vitaminC} onChange={handleChange} placeholder="Vitamin C (mg)" className="p-2 border border-gray-300 rounded" />
              <input name="vitaminD" value={form.vitaminD} onChange={handleChange} placeholder="Vitamin D (IU/µg)" className="p-2 border border-gray-300 rounded" />
            </div>
            <div className="flex space-x-2 mt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700">Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={
                  !form.name || !form.calories || !form.totalFat || !form.totalCarbs || !form.protein
                }
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Review & Save</h4>
            {/* Summary */}
            <div className="mb-4">
              <div className="mb-2 text-lg font-bold text-gray-800">{form.name}</div>
              {form.brand && <div className="mb-1 text-sm text-gray-600">Brand: {form.brand}</div>}
              {form.barcode && <div className="mb-1 text-sm text-gray-600">Barcode: {form.barcode}</div>}
              <div className="mb-1 text-sm text-gray-600">Serving Size: {form.servingSize}</div>
            </div>
            {/* Macro Dashboard */}
            <MacroChart
              calories={parseFloat(form.calories) || 0}
              protein={parseFloat(form.protein) || 0}
              carbs={parseFloat(form.totalCarbs) || 0}
              fat={parseFloat(form.totalFat) || 0}
              servings={servings}
              mode={macroMode}
              onModeChange={setMacroMode}
              showSwitcher={false}
              size={180}
            />
            {/* Micronutrients Section */}
            <div className="font-semibold text-gray-700 mb-1">Micronutrients</div>
            <ul className="ml-2 text-sm text-gray-700 space-y-1">
              {form.saturatedFat && <li>Saturated Fat: {form.saturatedFat}g</li>}
              {form.monounsaturatedFat && <li>Monounsaturated Fat: {form.monounsaturatedFat}g</li>}
              {form.polyunsaturatedFat && <li>Polyunsaturated Fat: {form.polyunsaturatedFat}g</li>}
              {form.transFat && <li>Trans Fat: {form.transFat}g</li>}
              {form.fiber && <li>Fiber: {form.fiber}g</li>}
              {form.sugar && <li>Sugar: {form.sugar}g</li>}
              {form.sodium && <li>Sodium: {form.sodium}mg</li>}
              {form.cholesterol && <li>Cholesterol: {form.cholesterol}mg</li>}
              {form.iron && <li>Iron: {form.iron}mg</li>}
              {form.potassium && <li>Potassium: {form.potassium}mg</li>}
              {form.zinc && <li>Zinc: {form.zinc}mg</li>}
              {form.vitaminA && <li>Vitamin A: {form.vitaminA}</li>}
              {form.vitaminC && <li>Vitamin C: {form.vitaminC}</li>}
              {form.vitaminD && <li>Vitamin D: {form.vitaminD}</li>}
            </ul>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <div className="flex space-x-2 mt-4">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700">Back</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium disabled:bg-gray-300">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeModal({ onClose, setLogRecipe, setShowLogModal, setLogMeal, setLogQuantity, setLogSuccess }: {
  onClose: () => void;
  setLogRecipe: (r: any) => void;
  setShowLogModal: (v: boolean) => void;
  setLogMeal: (m: string) => void;
  setLogQuantity: (q: number) => void;
  setLogSuccess: (v: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    servings: 1,
    ingredients: [] as any[],
  });
  const [bulkImportEnabled, setBulkImportEnabled] = useState(false);
  const [bulkIngredients, setBulkIngredients] = useState('');
  const [matchedIngredients, setMatchedIngredients] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [macroMode, setMacroMode] = useState<MacroChartMode>('perServing');
  const [totalWeight, setTotalWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('g');

  const UNIT_OPTIONS = ['g', 'ml', 'cup', 'tbsp', 'tsp', 'piece'];
  const MACRO_COLORS = ['#ef4444', '#3b82f6', '#eab308'];
  const UNIT_GRAM_EQUIV: Record<string, number> = { g: 1, ml: 1, cup: 240, tbsp: 15, tsp: 5, piece: 50 };

  const autoMatchIngredients = async () => {
    setMatchingLoading(true);
    setMatchingError(null);
    const lines = bulkIngredients.split('\n').map(l => l.trim()).filter(Boolean);
    const matches: any[] = [];
    for (const line of lines) {
      try {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .ilike('name', `%${line}%`)
          .limit(1);
        
        if (!error && data && data.length > 0) {
          matches.push({ ...data[0], original: line, quantity: 1 });
        } else {
          matches.push({ name: line, unmatched: true, quantity: 1 });
        }
      } catch (err) {
        matches.push({ name: line, unmatched: true, quantity: 1 });
      }
    }
    setMatchedIngredients(matches);
    setMatchingLoading(false);
  };

  const handleNextStep1 = async () => {
    if (bulkImportEnabled) {
      await autoMatchIngredients();
    } else {
      setMatchedIngredients([...recipeForm.ingredients]);
    }
    setStep(2);
  };

  const updateMatchedIngredient = (idx: number, newData: any) => {
    setMatchedIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, ...newData } : ing));
  };
  const removeMatchedIngredient = (idx: number) => {
    setMatchedIngredients(prev => prev.filter((_, i) => i !== idx));
  };
  const handleManualSearch = async (idx: number, query: string) => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        updateMatchedIngredient(idx, { ...data[0], unmatched: false });
      } else {
        updateMatchedIngredient(idx, { name: query, unmatched: true });
      }
    } catch {
      updateMatchedIngredient(idx, { name: query, unmatched: true });
    }
  };

  // Helper: get grams per serving for a food
  function getGramsPerServing(servingSize: string, name: string) {
    // Known conversions for common foods
    const known = [
      { name: /rice/i, unit: 'cup', grams: 158 }, // 1 cup cooked rice ≈ 158g
      { name: /oats/i, unit: 'cup', grams: 81 },
      { name: /black beans/i, unit: 'cup', grams: 172 },
      { name: /chicken breast/i, unit: 'piece', grams: 120 },
      // Add more as needed
    ];
    for (const k of known) {
      if (name.match(k.name) && servingSize.includes(k.unit)) return k.grams;
    }
    // Try to parse from servingSize string
    const match = servingSize.match(/(\d+\.?\d*)\s*(g|ml|cup|tbsp|tsp|piece)/i);
    if (match) {
      const amount = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'g' || unit === 'ml') return amount;
      // Fallbacks for other units
      if (unit === 'cup') return 240 * amount;
      if (unit === 'tbsp') return 15 * amount;
      if (unit === 'tsp') return 5 * amount;
      if (unit === 'piece') return 50 * amount;
    }
    return 100; // Default to 100g if unknown
  }

  const calculateMacros = () => {
    return matchedIngredients.reduce((total, ing) => {
      if (ing.unmatched) return total;
      const userUnit = ing.unit || (ing.serving_size && ing.serving_size.match(/ml|g|cup|tbsp|tsp|piece/i)?.[0]?.toLowerCase()) || 'g';
      const userQty = ing.quantity;
      const gramsPerServing = getGramsPerServing(ing.serving_size || '', ing.name || '');
      let factor = 1;
      if (userUnit === 'g' || userUnit === 'ml') {
        factor = (userQty) / gramsPerServing;
      } else if (userUnit === 'cup' && gramsPerServing) {
        factor = (userQty * 240) / gramsPerServing;
      } else if (userUnit === 'tbsp' && gramsPerServing) {
        factor = (userQty * 15) / gramsPerServing;
      } else if (userUnit === 'tsp' && gramsPerServing) {
        factor = (userQty * 5) / gramsPerServing;
      } else if (userUnit === 'piece' && gramsPerServing) {
        factor = (userQty * 50) / gramsPerServing;
      } else {
        // Fallback: try to use per 100g
        factor = (userQty * 1) / 100;
      }
      return {
        calories: total.calories + (ing.calories || 0) * factor,
        protein: total.protein + (ing.protein || 0) * factor,
        carbs: total.carbs + (ing.carbs || 0) * factor,
        fat: total.fat + (ing.fat || 0) * factor,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleSaveRecipe = async () => {
    setSaveLoading(true);
    try {
      // Calculate macros as in the review step
      const totalMacros = matchedIngredients.reduce((total, ing) => {
        if (ing.unmatched) return total;
        const userUnit = ing.unit || (ing.serving_size && ing.serving_size.match(/ml|g|cup|tbsp|tsp|piece/i)?.[0]?.toLowerCase()) || 'g';
        const userQty = ing.quantity;
        const gramsPerServing = getGramsPerServing(ing.serving_size || '', ing.name || '');
        let factor = 1;
        if (userUnit === 'g' || userUnit === 'ml') {
          factor = (userQty) / gramsPerServing;
        } else if (userUnit === 'cup' && gramsPerServing) {
          factor = (userQty * 240) / gramsPerServing;
        } else if (userUnit === 'tbsp' && gramsPerServing) {
          factor = (userQty * 15) / gramsPerServing;
        } else if (userUnit === 'tsp' && gramsPerServing) {
          factor = (userQty * 5) / gramsPerServing;
        } else if (userUnit === 'piece' && gramsPerServing) {
          factor = (userQty * 50) / gramsPerServing;
        } else {
          factor = (userQty * 1) / 100;
        }
        return {
          calories: total.calories + (ing.calories || 0) * factor,
          protein: total.protein + (ing.protein || 0) * factor,
          carbs: total.carbs + (ing.carbs || 0) * factor,
          fat: total.fat + (ing.fat || 0) * factor,
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
      const servings = recipeForm.servings || 1;
      const perServing = {
        calories: totalMacros.calories / servings,
        protein: totalMacros.protein / servings,
        carbs: totalMacros.carbs / servings,
        fat: totalMacros.fat / servings
      };
      const nutrition = { total: totalMacros, perServing };
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          name: recipeForm.name,
          servings: recipeForm.servings,
          ingredients: JSON.stringify(matchedIngredients.map(ing => ({
            ...ing,
            unit: ing.unit || 'g',
            quantity: ing.quantity || 1,
            calories: ing.calories || 0,
            protein: ing.protein || 0,
            carbs: ing.carbs || 0,
            fat: ing.fat || 0
          }))),
          calories: perServing.calories,
        protein: perServing.protein,
        carbs: perServing.carbs,
        fat: perServing.fat,
        nutrition: JSON.stringify(nutrition)
      })
      .select()
      .single();
      
      if (error) throw error;
      
      if (data) {
        const recipe = data;
        setLogRecipe(recipe);
        setShowLogModal(true);
        setLogMeal('Lunch');
        setLogQuantity(1);
        setLogSuccess(false);
        setRecipeForm({ name: '', servings: 1, ingredients: [] });
        onClose();
      } else {
        alert('Failed to save recipe.');
      }
    } catch (err) {
      alert('Failed to save recipe.');
    }
    setSaveLoading(false);
  };

  const servings = recipeForm.servings || 1;
  const macros = calculateMacros();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Macro Dashboard */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Recipe</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex flex-col items-center mb-4 md:mb-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight/Volume</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  min="1"
                  value={totalWeight}
                  onChange={e => setTotalWeight(e.target.value)}
                  className="w-24 p-2 border border-gray-300 rounded"
                  placeholder="e.g. 800"
                />
                <select
                  value={weightUnit}
                  onChange={e => setWeightUnit(e.target.value)}
                  className="p-2 border border-gray-300 rounded"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="cup">cup</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                </select>
              </div>
              {totalWeight && servings > 0 && (
                <div className="text-xs text-gray-500">1 serving ≈ {Math.round(parseFloat(totalWeight) / servings)} {weightUnit}</div>
              )}
            </div>
            <MacroChart
              calories={macros.calories}
              protein={macros.protein}
              carbs={macros.carbs}
              fat={macros.fat}
              servings={servings}
              mode={macroMode}
              onModeChange={setMacroMode}
              showSwitcher={true}
              size={200}
            />
          </div>
        </div>
        {/* Multi-step form */}
        <div>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
              <input
                type="text"
                placeholder="e.g. Chicken Stir Fry"
                value={recipeForm.name}
                onChange={e => setRecipeForm({ ...recipeForm, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none mb-4"
              />
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input
                type="number"
                placeholder="e.g. 4"
                value={recipeForm.servings}
                onChange={e => setRecipeForm({ ...recipeForm, servings: parseInt(e.target.value) || 1 })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none mb-4"
              />
              <div className="flex items-center space-x-2 mt-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">Bulk Ingredients Import</label>
                  <input
                  type="checkbox"
                  checked={bulkImportEnabled}
                  onChange={() => setBulkImportEnabled(!bulkImportEnabled)}
                  className="ml-2"
                  />
                </div>
              {bulkImportEnabled && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paste or type your ingredients (one per line):</label>
                  <textarea
                    value={bulkIngredients}
                    onChange={e => setBulkIngredients(e.target.value)}
                    placeholder="e.g. 2 chicken breasts\n1 cup broccoli\n1 tbsp olive oil"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none min-h-[80px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">We'll match them to foods in our database.</p>
                </div>
              )}
              <div className="flex space-x-3 mt-6">
                      <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
                      >
                  Cancel
                      </button>
                <button
                  onClick={handleNextStep1}
                  disabled={!recipeForm.name || !recipeForm.servings}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium disabled:bg-gray-300"
                >
                  Next
                </button>
              </div>
                  </div>
                )}
          {/* Step 2: Ingredient Matching */}
          {step === 2 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Ingredients</h4>
              {matchingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Matching ingredients...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {matchedIngredients.length === 0 && (
                    <p className="text-gray-500 text-sm">No ingredients found. Go back and add some.</p>
                  )}
                  {matchedIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <input
                        type="number"
                        step="0.1"
                        value={ing.quantity}
                        onChange={e => updateMatchedIngredient(idx, { quantity: parseFloat(e.target.value) || 1 })}
                        className="w-16 p-1 border border-gray-300 rounded text-sm"
                      />
                      <select
                        value={ing.unit || (ing.serving_size && ing.serving_size.match(/ml|g|cup|tbsp|tsp|piece/i)?.[0]?.toLowerCase()) || 'g'}
                        onChange={e => updateMatchedIngredient(idx, { unit: e.target.value })}
                        className="p-1 border border-gray-300 rounded text-sm"
                      >
                        {UNIT_OPTIONS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                      <span className="flex-1 text-sm text-gray-800">
                        {ing.name} {ing.serving_size && <span className="text-xs text-gray-500">({ing.serving_size})</span>} {ing.unmatched && <span className="text-xs text-red-500">(unmatched)</span>}
                      </span>
                      {!ing.unmatched && (
                        <span className="text-xs text-gray-500">
                          <input
                            type="number"
                            value={ing.calories || 0}
                            onChange={e => updateMatchedIngredient(idx, { calories: parseFloat(e.target.value) || 0 })}
                            className="w-12 p-1 border border-gray-300 rounded text-xs mr-1"
                          /> cal,
                          <input
                            type="number"
                            value={ing.protein || 0}
                            onChange={e => updateMatchedIngredient(idx, { protein: parseFloat(e.target.value) || 0 })}
                            className="w-10 p-1 border border-gray-300 rounded text-xs mx-1"
                          />g P,
                          <input
                            type="number"
                            value={ing.carbs || 0}
                            onChange={e => updateMatchedIngredient(idx, { carbs: parseFloat(e.target.value) || 0 })}
                            className="w-10 p-1 border border-gray-300 rounded text-xs mx-1"
                          />g C,
                          <input
                            type="number"
                            value={ing.fat || 0}
                            onChange={e => updateMatchedIngredient(idx, { fat: parseFloat(e.target.value) || 0 })}
                            className="w-10 p-1 border border-gray-300 rounded text-xs mx-1"
                          />g F
                        </span>
                      )}
                      <button
                        onClick={() => removeMatchedIngredient(idx)}
                        className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center"
                      >
                        ×
                      </button>
                      {ing.unmatched && (
                        <input
                          type="text"
                          placeholder="Search manually..."
                          onBlur={e => handleManualSearch(idx, e.target.value)}
                          className="w-32 p-1 border border-gray-300 rounded text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium"
                  disabled={matchedIngredients.length === 0 || matchedIngredients.some(ing => ing.unmatched)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {/* Step 3: Review & Save */}
          {step === 3 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Review & Save</h4>
              <div className="mb-4">
                <div className="mb-2">
                  <span className="font-semibold">Recipe Name:</span> {recipeForm.name}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Servings:</span> {recipeForm.servings}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Ingredients:</span>
                  <ul className="ml-4 mt-1 space-y-1">
                    {matchedIngredients.map((ing, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        {ing.quantity} {ing.unit || 'g'} {ing.name} {ing.serving_size && <span className="text-xs text-gray-500">({ing.serving_size})</span>}
                        <span className="text-xs text-gray-500 ml-2">{ing.calories || 0} cal, {ing.protein || 0}g P, {ing.carbs || 0}g C, {ing.fat || 0}g F</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Macros (per serving):</span>
                  <ul className="ml-4 mt-1 text-sm text-gray-700">
                    <li>Calories: {Math.round(macros.calories / servings)} kcal</li>
                    <li>Protein: {Math.round(macros.protein / servings)} g</li>
                    <li>Carbs: {Math.round(macros.carbs / servings)} g</li>
                    <li>Fat: {Math.round(macros.fat / servings)} g</li>
                  </ul>
                </div>
              </div>
            <div className="flex space-x-3 mt-6">
              <button
                  onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                  Back
              </button>
              <button
                  onClick={handleSaveRecipe}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Recipe'}
              </button>
            </div>
            </div>
      )}
        </div>
      </div>
    </div>
  );
}

function LogRecipeModal({ onClose, recipe, meal, quantity, onMealChange, onQuantityChange, onSave, onCancel, onSuccess }: {
  onClose: () => void;
  recipe: any;
  meal: string;
  quantity: number;
  onMealChange: (meal: string) => void;
  onQuantityChange: (quantity: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onSuccess: boolean;
}) {
  if (!recipe) return null;
  const perServing = recipe.nutrition?.perServing || recipe.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Log Recipe to Meal</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>
        
        {onSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="text-green-600" size={32} />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Recipe Logged!</h4>
            <p className="text-sm text-gray-600">Your recipe has been added to {meal}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipe</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{recipe.name}</p>
                <p className="text-sm text-gray-600">
                  {Math.round(perServing.calories)} cal •
                  {Math.round(perServing.protein)}g protein •
                  {Math.round(perServing.carbs)}g carbs •
                  {Math.round(perServing.fat)}g fat
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal</label>
              <select
                value={meal}
                onChange={(e) => onMealChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              >
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (servings)</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                onClick={onSave}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700"
              >
                Log to {meal}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Fuel;

// Add FoodSearchTabs component before Fuel
function FoodSearchTabs({ selectedMeal, onClose, addFood, setShowRecipeModal, setSelectedRecipeDetail, setShowRecipeDetail, setLogRecipe, setShowLogModal, setLogMeal, setLogQuantity, setLogSuccess }: {
  selectedMeal: string | null;
  onClose: () => void;
  addFood: (food: any, meal: string) => void;
  setShowRecipeModal: (v: boolean) => void;
  setSelectedRecipeDetail: (r: any) => void;
  setShowRecipeDetail: (v: boolean) => void;
  setLogRecipe: (r: any) => void;
  setShowLogModal: (v: boolean) => void;
  setLogMeal: (m: string) => void;
  setLogQuantity: (q: number) => void;
  setLogSuccess: (v: boolean) => void;
}) {
  const [tab, setTab] = useState<'myrecipes' | 'search' | 'addrecipe'>('search');
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    if (tab === 'myrecipes') {
      setLoadingRecipes(true);
      supabase.from('recipes').select('*').then(({ data, error }) => {
        if (error) throw error;
        const res = { data: data || [] };
        setMyRecipes(res.data.filter((r: any) => r.name && !r.title));
        setLoadingRecipes(false);
      }).catch(() => setLoadingRecipes(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'search' && searchQuery) {
      setLoadingSearch(true);
      supabase.from('foods').select('*')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(50)
        .then(({ data, error }) => {
          if (error) throw error;
          setSearchResults(data || []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setLoadingSearch(false));
    } else if (tab === 'search') {
      setSearchResults([]);
    }
  }, [tab, searchQuery]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex space-x-2 mb-4">
        <button onClick={() => setTab('myrecipes')} className={`flex-1 py-2 rounded-lg font-medium ${tab === 'myrecipes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>My Recipes</button>
        <button onClick={() => setTab('search')} className={`flex-1 py-2 rounded-lg font-medium ${tab === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>Search</button>
        <button onClick={() => setTab('addrecipe')} className={`flex-1 py-2 rounded-lg font-medium ${tab === 'addrecipe' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>Add Recipe</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'myrecipes' && (
          loadingRecipes ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : myRecipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recipes yet. Create one!</div>
          ) : (
            <ul className="space-y-3">
              {myRecipes.map(recipe => (
                <li
                  key={recipe.id}
                  className="flex items-center bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition"
                  onClick={() => { setSelectedRecipeDetail(recipe); setShowRecipeDetail(true); }}
                >
                  {/* Remove image */}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{recipe.name}</div>
                    <div className="text-xs text-gray-500 mb-1">Servings: {recipe.servings}</div>
                    <div className="flex space-x-2 text-xs text-gray-600">
                      <span>Cal: {Math.round(recipe.nutrition?.perServing?.calories ?? recipe.nutrition?.calories ?? 0)}</span>
                      <span>P: {Math.round(recipe.nutrition?.perServing?.protein ?? recipe.nutrition?.protein ?? 0)}g</span>
                      <span>C: {Math.round(recipe.nutrition?.perServing?.carbs ?? recipe.nutrition?.carbs ?? 0)}g</span>
                      <span>F: {Math.round(recipe.nutrition?.perServing?.fat ?? recipe.nutrition?.fat ?? 0)}g</span>
                    </div>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={async e => {
                      e.stopPropagation();
                      if (window.confirm('Delete this recipe?')) {
                        try {
                          const { error } = await supabase
                            .from('recipes')
                            .delete()
                            .eq('id', recipe.id);
                          
                          if (error) throw error;
                          setMyRecipes(myRecipes.filter(r => r.id !== recipe.id));
                        } catch {
                          alert('Failed to delete recipe.');
                        }
                      }
                    }}
                    className="ml-2 px-2 py-1 text-red-600 hover:text-white hover:bg-red-600 rounded"
                    title="Delete Recipe"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
        {tab === 'search' && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div className="space-y-3">
              {loadingSearch && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Searching foods...</p>
                </div>
              )}
              {searchResults.map((food, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer hover:border-blue-300 transition-all"
                  onClick={() => addFood(food, selectedMeal || 'Snack')}
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{food.name}</h4>
                    <p className="text-sm text-gray-600">
                      {food.brand} • {food.serving_size || '100g'}
                    </p>
                    {food.calories && (
                      <p className="text-sm text-gray-600">
                        {food.calories} cal • {food.protein || 0}g protein • {food.carbs || 0}g carbs • {food.fat || 0}g fat
                      </p>
                    )}
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plus className="text-blue-600" size={16} />
                  </div>
                </motion.div>
              ))}
              {!loadingSearch && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No foods found for "{searchQuery}"</p>
                  <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
                </div>
              )}
            </div>
          </>
        )}
        {tab === 'addrecipe' && (
          <div className="flex flex-col items-center justify-center h-full">
            <button
              onClick={() => setShowRecipeModal(true)}
              className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 mb-4"
            >
              Create a New Recipe
            </button>
            <p className="text-gray-500 text-sm">Build your own recipe and log it to a meal.</p>
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="w-full mt-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Close
      </button>
    </div>
  );
}