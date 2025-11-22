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
import Svg, { Circle } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { playSound } from '../utils/soundEffects';
import { sendHydrationReminder, sendMealReminder } from '../utils/notifications';
import PhotoRecognitionModal from '../components/PhotoRecognitionModal';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

// Pie Chart Component - Uniform size 64 to match Home page
const PieChart = ({ value, max, color, size = 64 }: { value: number; max: number; color: string; size?: number }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 18; // Adjusted for size 64
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="5"
          fill="transparent"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth="5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }}>
        {Math.round(value)}
      </Text>
    </View>
  );
};

export default function FuelScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { 
    profile, 
    dailyData, 
    updateDailyData, 
    addFoodEntry, 
    getFoodEntriesForMeal, 
    getUsedDays,
    getCurrentDate,
    removeFoodEntry,
    isPremiumOrTrial,
    getFoodEntriesForDate,
  } = useUser();
  
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [waterAmount, setWaterAmount] = useState('');
  const [waterUnit, setWaterUnit] = useState('8oz');
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [foodSearchTab, setFoodSearchTab] = useState<'myrecipes' | 'search' | 'addrecipe'>('search');
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showBrowseRecipes, setShowBrowseRecipes] = useState(false);
  const [browseRecipes, setBrowseRecipes] = useState<any[]>([]);
  const [browseRecipesCategory, setBrowseRecipesCategory] = useState('All');
  const [browseRecipesSearch, setBrowseRecipesSearch] = useState('');
  const [loadingBrowseRecipes, setLoadingBrowseRecipes] = useState(false);
  const [showLogRecipeModal, setShowLogRecipeModal] = useState(false);
  const [logRecipe, setLogRecipe] = useState<any>(null);
  const [logMeal, setLogMeal] = useState('Lunch');
  const [logQuantity, setLogQuantity] = useState(1);
  const [logSuccess, setLogSuccess] = useState(false);

  const waterUnits = [
    { value: '8oz', label: '8 fl oz', ml: 237 },
    { value: '500ml', label: '500 ml', ml: 500 },
    { value: '1cup', label: '1 cup (250ml)', ml: 250 },
  ];

  const mealConfigs = {
    Breakfast: { icon: 'sunny', color: '#fed7aa', iconColor: '#ea580c' },
    Lunch: { icon: 'sunny-outline', color: '#fef3c7', iconColor: '#d97706' },
    Dinner: { icon: 'moon', color: '#e9d5ff', iconColor: '#9333ea' },
    Snack: { icon: 'restaurant', color: '#fce7f3', iconColor: '#db2777' },
  };

  const defaultMeals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

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
        isToday: date.toISOString().split('T')[0] === getCurrentDate(),
      });
    }
    return weekDates;
  };

  const weekDates = getCurrentWeekDates();
  const usedDays = getUsedDays();

  // Calculate totals for selected date
  const dateEntries = getFoodEntriesForMeal('', selectedDate);
  const todayTotals = dateEntries.reduce(
    (total, entry) => ({
      calories: total.calories + entry.calories * entry.quantity,
      protein: total.protein + entry.protein * entry.quantity,
      carbs: total.carbs + entry.carbs * entry.quantity,
      fat: total.fat + entry.fat * entry.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remaining = {
    calories: Math.max(0, (profile?.dailyCalories || 2000) - todayTotals.calories),
    protein: Math.max(0, (profile?.dailyProtein || 150) - todayTotals.protein),
    carbs: Math.max(0, (profile?.dailyCarbs || 225) - todayTotals.carbs),
    fat: Math.max(0, (profile?.dailyFat || 67) - todayTotals.fat),
  };

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      // Use Supabase RPC for food search or direct table query
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
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery && foodSearchTab === 'search') {
        searchFoods(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, foodSearchTab]);

  useEffect(() => {
    if (foodSearchTab === 'myrecipes') {
      setLoadingRecipes(true);
      supabase
        .from('recipes')
        .select('*')
        .then(({ data, error }) => {
          if (error) throw error;
          setMyRecipes((data || []).filter((r: any) => r.name && !r.title));
          setLoadingRecipes(false);
        })
        .catch(() => setLoadingRecipes(false));
    }
  }, [foodSearchTab]);

  // Listen for route params to open modals
  useEffect(() => {
    const params = route.params as any;
    if (params?.openRecipes) {
      setShowBrowseRecipes(true);
      // Clear the param after opening
      navigation.setParams({ openRecipes: undefined });
    }
  }, [route.params, navigation]);

  useEffect(() => {
    if (showBrowseRecipes) {
      setLoadingBrowseRecipes(true);
      (async () => {
        try {
          let query = supabase.from('recipes').select('*');
          
          if (browseRecipesCategory !== 'All') {
            query = query.eq('category', browseRecipesCategory);
          }
          
          if (browseRecipesSearch) {
            query = query.or(`title.ilike.%${browseRecipesSearch}%,name.ilike.%${browseRecipesSearch}%`);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          // Filter out user-created recipes (they have 'name' not 'title')
          setBrowseRecipes((data || []).filter((r: any) => r.title || (!r.name && !r.title)));
        } catch (error) {
          console.error('Error fetching browse recipes:', error);
          setBrowseRecipes([]);
        } finally {
          setLoadingBrowseRecipes(false);
        }
      })();
    }
  }, [showBrowseRecipes, browseRecipesCategory, browseRecipesSearch]);

  const addFood = (food: any, meal: string) => {
    // Check premium/trial status for meal limit
    if (!isPremiumOrTrial()) {
      // Count unique meals with entries for today
      const todayEntries = getFoodEntriesForDate(selectedDate);
      const uniqueMeals = new Set(todayEntries.map(entry => entry.meal));
      
      // If already 4 meals and this meal doesn't have entries yet, block
      if (uniqueMeals.size >= 4 && !uniqueMeals.has(meal)) {
    Alert.alert(
          'Meal Limit Reached',
          'Free users can log up to 4 meals per day. Upgrade to Premium for unlimited meal logging!',
      [
        { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('Premium' as never) },
          ]
        );
        return;
      }
    }

    const nutrition = food.nutrition?.perServing || food.nutrition || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
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
      date: selectedDate,
      nutrition,
    };
    addFoodEntry(entry);
    playSound('swipe');
    
    // Check for meal reminder (triggered at 7 PM if <3 meals)
    // Use setTimeout to ensure entry is added first
    setTimeout(() => {
      const todayEntries = getFoodEntriesForDate(selectedDate);
      const uniqueMeals = new Set(todayEntries.map(e => e.meal));
      sendMealReminder(uniqueMeals.size);
    }, 100);
    
    setShowFoodSearch(false);
    setSearchQuery('');
    setSelectedMeal(null);
  };

  const getMealTotals = (meal: string) => {
    return getFoodEntriesForMeal(meal, selectedDate).reduce(
      (total, entry) => {
        const nutrition = entry.nutrition || entry;
        return {
          calories: total.calories + (nutrition.calories || 0) * entry.quantity,
          protein: total.protein + (nutrition.protein || 0) * entry.quantity,
          carbs: total.carbs + (nutrition.carbs || 0) * entry.quantity,
          fat: total.fat + (nutrition.fat || 0) * entry.quantity,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const addWater = () => {
    if (!waterAmount) return;

    const selectedUnit = waterUnits.find((unit) => unit.value === waterUnit);
    const mlAmount = selectedUnit ? selectedUnit.ml * parseFloat(waterAmount) : 237;
    const ozAmount = mlAmount / 29.5735;

    const newWaterAmount = dailyData.water + ozAmount;
    updateDailyData({ water: newWaterAmount });
    playSound('waterDroplet');
    
    // Trigger hydration reminder if at 45-55% of goal
    const waterGoal = profile?.dailyCalories ? Math.round((profile.weightInKg * 0.67 * 33.814) * 1.1) : 64;
    sendHydrationReminder(newWaterAmount, waterGoal);
    
    setWaterAmount('');
    setShowWaterModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Fuel</Text>
              <Text style={styles.subtitle}>Track your nutrition & hydration</Text>
      </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate('Premium' as never)}
                activeOpacity={0.7}
              >
                <Ionicons name="diamond" size={20} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, styles.plusButton]}
                onPress={() => setShowPlusMenu(!showPlusMenu)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
          </View>
          </View>
      </View>

        {/* Plus Menu */}
        {showPlusMenu && (
          <View style={styles.plusMenu}>
            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                playSound('pageTurn');
                setShowFoodSearch(true);
                setFoodSearchTab('search');
              }}
            >
              <Ionicons name="search" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>Search Foods</Text>
            </TouchableOpacity>
        <TouchableOpacity 
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                setShowAddFoodModal(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>Add Food/Ingredient</Text>
        </TouchableOpacity>
        <TouchableOpacity 
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                setShowRecipeModal(true);
              }}
            >
              <Ionicons name="restaurant" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>Create Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                setShowPhotoCapture(true);
              }}
            >
              <Ionicons name="camera" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>Photo Calorie Detector</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                setShowBrowseRecipes(true);
              }}
            >
              <Ionicons name="book" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>Browse Recipes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                setShowFoodSearch(true);
                setFoodSearchTab('myrecipes');
              }}
            >
              <Ionicons name="restaurant-outline" size={20} color="#1e293b" />
              <Text style={styles.plusMenuText}>My Recipes</Text>
        </TouchableOpacity>
      </View>
        )}

        {/* Weekly Calendar */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Week</Text>
            <Ionicons name="calendar" size={24} color="#2563eb" />
          </View>

          <View style={styles.calendarContainer}>
            {/* Day names */}
            <View style={styles.calendarRow}>
              {weekDates.map((day, index) => (
                <View key={`day-${index}`} style={styles.calendarItem}>
                  <Text style={styles.calendarDay}>{day.day}</Text>
                </View>
              ))}
            </View>

            {/* Day numbers */}
            <View style={styles.calendarRow}>
              {weekDates.map((day, index) => (
            <TouchableOpacity 
                  key={`date-${index}`}
                  style={[
                    styles.calendarDateButton,
                    day.fullDate === selectedDate && styles.calendarDateButtonSelected,
                  ]}
                  onPress={() => setSelectedDate(day.fullDate)}
                >
                  <Text
                    style={[
                      styles.calendarDateText,
                      day.fullDate === selectedDate && styles.calendarDateTextSelected,
                    ]}
                  >
                    {day.date}
                </Text>
                </TouchableOpacity>
              ))}
              </View>

            {/* Usage dots */}
            <View style={styles.calendarRow}>
              {weekDates.map((day, index) => (
                <View key={`dot-${index}`} style={styles.calendarItem}>
                  <View
                    style={[
                      styles.calendarDot,
                      usedDays.includes(day.fullDate) && styles.calendarDotActive,
                    ]}
                  />
              </View>
              ))}
            </View>
          </View>
      </View>

        {/* Today's Nutrition */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Nutrition</Text>
          <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
              <PieChart value={todayTotals.calories} max={profile?.dailyCalories || 2000} color="#3b82f6" size={64} />
              <Text style={styles.nutritionLabel} numberOfLines={1} adjustsFontSizeToFit>Calories</Text>
              <Text style={styles.nutritionRemaining} numberOfLines={1} adjustsFontSizeToFit>{Math.round(remaining.calories)} left</Text>
          </View>
          <View style={styles.nutritionItem}>
              <PieChart value={todayTotals.protein} max={profile?.dailyProtein || 150} color="#ef4444" size={64} />
              <Text style={styles.nutritionLabel} numberOfLines={1} adjustsFontSizeToFit>Protein</Text>
              <Text style={styles.nutritionRemaining} numberOfLines={1} adjustsFontSizeToFit>{Math.round(remaining.protein)}g left</Text>
          </View>
          <View style={styles.nutritionItem}>
              <PieChart value={todayTotals.carbs} max={profile?.dailyCarbs || 225} color="#3b82f6" size={64} />
              <Text style={styles.nutritionLabel} numberOfLines={1} adjustsFontSizeToFit>Carbs</Text>
              <Text style={styles.nutritionRemaining} numberOfLines={1} adjustsFontSizeToFit>{Math.round(remaining.carbs)}g left</Text>
            </View>
            <View style={styles.nutritionItem}>
              <PieChart value={todayTotals.fat} max={profile?.dailyFat || 67} color="#eab308" size={64} />
              <Text style={styles.nutritionLabel} numberOfLines={1} adjustsFontSizeToFit>Fat</Text>
              <Text style={styles.nutritionRemaining} numberOfLines={1} adjustsFontSizeToFit>{Math.round(remaining.fat)}g left</Text>
            </View>
          </View>
        </View>

        {/* Water Tracking */}
        <View style={styles.card}>
          <View style={styles.waterHeader}>
              <View style={styles.waterHeaderLeft}>
              <View style={styles.waterIconContainer}>
                <Ionicons name="water" size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.waterTitle}>Water</Text>
                <Text style={styles.waterSubtitle}>
                  {Math.round(dailyData.water)}oz of 64oz
            </Text>
          </View>
        </View>
            <TouchableOpacity
              style={styles.addWaterButton}
              onPress={() => setShowWaterModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addWaterButtonText}>Add Water</Text>
            </TouchableOpacity>
      </View>

          <View style={styles.waterProgress}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((glass) => (
              <View
                key={glass}
                style={[
                  styles.waterGlass,
                  glass <= Math.floor(dailyData.water / 8) && styles.waterGlassFilled,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsSection}>
          {defaultMeals.map((meal) => {
            const mealTotals = getMealTotals(meal);
            const mealConfig = mealConfigs[meal as keyof typeof mealConfigs];
            const mealEntries = getFoodEntriesForMeal(meal, selectedDate);

            return (
              <View key={meal} style={styles.mealCard}>
                <View style={styles.mealCardHeader}>
                  <View style={styles.mealCardHeaderLeft}>
                    <View style={[styles.mealIconContainer, { backgroundColor: mealConfig.color }]}>
                      <Ionicons name={mealConfig.icon as any} size={24} color={mealConfig.iconColor} />
                    </View>
                    <View>
                      <Text style={styles.mealName}>{meal}</Text>
                      <Text style={styles.mealTotals}>
                        {Math.round(mealTotals.calories)} cal • {Math.round(mealTotals.protein)}g protein •{' '}
                        {Math.round(mealTotals.carbs)}g carbs • {Math.round(mealTotals.fat)}g fat
                      </Text>
                    </View>
                  </View>
            <TouchableOpacity 
                    style={styles.mealAddButton}
                    onPress={() => {
                      setSelectedMeal(meal);
                      setShowFoodSearch(true);
                      setFoodSearchTab('search');
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color="#64748b" />
            </TouchableOpacity>
                </View>

                {mealEntries.length > 0 ? (
                  <View style={styles.mealEntries}>
                    {mealEntries.map((entry) => {
                      const nutrition = entry.nutrition || entry;
                      return (
                        <View key={entry.id} style={styles.mealEntry}>
                          <View style={styles.mealEntryLeft}>
                            <Text style={styles.mealEntryName}>{entry.name}</Text>
                            <Text style={styles.mealEntryQuantity}>
                              {entry.quantity}x • {Math.round((nutrition.calories || 0) * entry.quantity)} cal
                            </Text>
                          </View>
                          <View style={styles.mealEntryRight}>
                            <Text style={styles.mealEntryMacros}>
                              {Math.round((nutrition.protein || 0) * entry.quantity)}g protein
                            </Text>
                            <Text style={styles.mealEntryMacros}>
                              {Math.round((nutrition.carbs || 0) * entry.quantity)}g carbs
                            </Text>
                            <Text style={styles.mealEntryMacros}>
                              {Math.round((nutrition.fat || 0) * entry.quantity)}g fat
                            </Text>
            <TouchableOpacity 
                              style={styles.deleteEntryButton}
                              onPress={() => removeFoodEntry(entry.id)}
                              activeOpacity={0.7}
            >
                              <Ionicons name="trash" size={16} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
                      );
                    })}
      </View>
                ) : (
                  <View style={styles.emptyMeal}>
                    <Text style={styles.emptyMealText}>No foods logged yet</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Add Meal Button */}
          <TouchableOpacity
            style={styles.addMealButton}
            onPress={() => {
              if (!profile?.isPremium) {
                navigation.navigate('Premium' as never);
              } else {
                Alert.alert('Add Custom Meal', 'Feature coming soon!');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#64748b" />
            <Text style={styles.addMealText}>Add Meal</Text>
            {!profile?.isPremium && <Ionicons name="diamond" size={16} color="#f59e0b" />}
          </TouchableOpacity>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Food Search Modal */}
      <Modal
        visible={showFoodSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFoodSearch(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Food</Text>
            <TouchableOpacity onPress={() => setShowFoodSearch(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, foodSearchTab === 'myrecipes' && styles.tabActive]}
              onPress={() => setFoodSearchTab('myrecipes')}
            >
              <Text style={[styles.tabText, foodSearchTab === 'myrecipes' && styles.tabTextActive]}>
                My Recipes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, foodSearchTab === 'search' && styles.tabActive]}
              onPress={() => setFoodSearchTab('search')}
            >
              <Text style={[styles.tabText, foodSearchTab === 'search' && styles.tabTextActive]}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, foodSearchTab === 'addrecipe' && styles.tabActive]}
              onPress={() => setFoodSearchTab('addrecipe')}
            >
              <Text style={[styles.tabText, foodSearchTab === 'addrecipe' && styles.tabTextActive]}>
                Add Recipe
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {foodSearchTab === 'myrecipes' && (
              <>
                {loadingRecipes ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : myRecipes.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No recipes yet. Create one!</Text>
                  </View>
                ) : (
                  <View style={styles.recipesList}>
                    {myRecipes.map((recipe) => (
                      <TouchableOpacity
                        key={recipe.id}
                        style={styles.recipeItem}
                        onPress={() => {
                          addFood(recipe, selectedMeal || 'Snack');
                        }}
                      >
                        <View style={styles.recipeItemContent}>
                          <Text style={styles.recipeItemName}>{recipe.name}</Text>
                          <Text style={styles.recipeItemServings}>Servings: {recipe.servings}</Text>
                          <View style={styles.recipeItemMacros}>
                            <Text style={styles.recipeItemMacro}>
                              Cal:{' '}
                              {Math.round(
                                recipe.nutrition?.perServing?.calories ?? recipe.nutrition?.calories ?? 0
                              )}
                            </Text>
                            <Text style={styles.recipeItemMacro}>
                              P:{' '}
                              {Math.round(
                                recipe.nutrition?.perServing?.protein ?? recipe.nutrition?.protein ?? 0
                              )}
                              g
                            </Text>
                            <Text style={styles.recipeItemMacro}>
                              C:{' '}
                              {Math.round(
                                recipe.nutrition?.perServing?.carbs ?? recipe.nutrition?.carbs ?? 0
                              )}
                              g
                            </Text>
                            <Text style={styles.recipeItemMacro}>
                              F:{' '}
                              {Math.round(recipe.nutrition?.perServing?.fat ?? recipe.nutrition?.fat ?? 0)}g
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteRecipeButton}
                          onPress={async (e) => {
                            e.stopPropagation();
                            Alert.alert('Delete Recipe', 'Are you sure?', [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('recipes')
                                      .delete()
                                      .eq('id', recipe.id);
                                    
                                    if (error) throw error;
                                    setMyRecipes(myRecipes.filter((r) => r.id !== recipe.id));
                                  } catch {
                                    Alert.alert('Error', 'Failed to delete recipe.');
                                  }
                                },
                              },
                            ]);
                          }}
                        >
                          <Ionicons name="trash" size={20} color="#dc2626" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {foodSearchTab === 'search' && (
              <>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
                    placeholder="Search foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
                </View>

                {loadingSearch ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Searching foods...</Text>
                  </View>
                ) : (
                  <View style={styles.searchResults}>
                    {searchResults.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.foodItem}
                        onPress={() => addFood(food, selectedMeal || 'Snack')}
                      >
                        <View style={styles.foodItemContent}>
                          <Text style={styles.foodItemName}>{food.name}</Text>
                          <Text style={styles.foodItemBrand}>
                            {food.brand} • {food.serving_size || '100g'}
                    </Text>
                          {food.calories && (
                            <Text style={styles.foodItemNutrition}>
                              {food.calories} cal • {food.protein || 0}g protein • {food.carbs || 0}g carbs •{' '}
                              {food.fat || 0}g fat
                            </Text>
                          )}
                        </View>
                        <View style={styles.foodItemAdd}>
                          <Ionicons name="add-circle" size={24} color="#3b82f6" />
                  </View>
                </TouchableOpacity>
                    ))}
                    {!loadingSearch && searchQuery && searchResults.length === 0 && (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No foods found for "{searchQuery}"</Text>
                        <Text style={styles.emptySubtext}>Try a different search term</Text>
                      </View>
                    )}
        </View>
                )}
              </>
            )}

            {foodSearchTab === 'addrecipe' && (
              <View style={styles.addRecipeContainer}>
                <TouchableOpacity
                  style={styles.createRecipeButton}
                  onPress={() => {
                    setShowFoodSearch(false);
                    setShowRecipeModal(true);
                  }}
                >
                  <Text style={styles.createRecipeButtonText}>Create a New Recipe</Text>
                </TouchableOpacity>
                <Text style={styles.createRecipeSubtext}>Build your own recipe and log it to a meal.</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Water Modal */}
      <Modal visible={showWaterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.waterModalContent}>
          <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Water</Text>
            <TouchableOpacity onPress={() => setShowWaterModal(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
            <View style={styles.waterModalBody}>
              <Text style={styles.waterModalLabel}>Amount</Text>
            <TextInput
                style={styles.waterModalInput}
                placeholder="1"
              value={waterAmount}
              onChangeText={setWaterAmount}
              keyboardType="numeric"
            />
            
              <Text style={styles.waterModalLabel}>Unit</Text>
              <View style={styles.waterUnitGrid}>
              {waterUnits.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.waterUnitButton,
                      waterUnit === unit.value && styles.waterUnitButtonSelected,
                  ]}
                  onPress={() => setWaterUnit(unit.value)}
                >
                    <Text
                      style={[
                        styles.waterUnitButtonText,
                        waterUnit === unit.value && styles.waterUnitButtonTextSelected,
                      ]}
                    >
                    {unit.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
              {waterAmount && (
                <View style={styles.waterPreview}>
                  <Text style={styles.waterPreviewText}>
                    Adding: {waterAmount} × {waterUnits.find((u) => u.value === waterUnit)?.label} ={' '}
                    {Math.round(
                      ((waterUnits.find((u) => u.value === waterUnit)?.ml || 237) * parseFloat(waterAmount)) /
                        29.5735
                    )}{' '}
                    fl oz
                  </Text>
                </View>
              )}

              <View style={styles.waterModalButtons}>
                <TouchableOpacity
                  style={styles.waterModalCancelButton}
                  onPress={() => {
                    setShowWaterModal(false);
                    setWaterAmount('');
                  }}
                >
                  <Text style={styles.waterModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.waterModalAddButton, !waterAmount && styles.waterModalAddButtonDisabled]}
                  onPress={addWater}
                  disabled={!waterAmount}
                >
                  <Text style={styles.waterModalAddText}>Add Water</Text>
            </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Recognition Modal */}
      <PhotoRecognitionModal
        visible={showPhotoCapture}
        onClose={() => setShowPhotoCapture(false)}
        onAddFood={(item, quantity, meal) => {
          const entry = {
            id: Date.now().toString(),
            name: item.name,
            calories: item.calories * quantity,
            protein: item.protein * quantity,
            carbs: item.carbs * quantity,
            fat: item.fat * quantity,
            quantity,
            meal,
            date: currentDate,
            nutrition: item,
          };
          addFoodEntry(entry);
          setShowPhotoCapture(false);
          playSound('success');
          Alert.alert('Success', `Added ${item.name} to ${meal}`);
        }}
        meal={selectedMeal || 'Lunch'}
      />

      {/* Create Recipe Modal - Simplified Version */}
      <CreateRecipeModal
        visible={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        onRecipeCreated={(recipe) => {
          setLogRecipe(recipe);
          setShowLogRecipeModal(true);
          setLogMeal('Lunch');
          setLogQuantity(1);
          setLogSuccess(false);
          setShowRecipeModal(false);
        }}
      />

      {/* Add Food Modal - Full Implementation */}
      <AddFoodModal
        visible={showAddFoodModal}
        onClose={() => setShowAddFoodModal(false)}
      />

      {/* Browse Recipes Modal */}
      <BrowseRecipesModal
        visible={showBrowseRecipes}
        recipes={browseRecipes}
        loading={loadingBrowseRecipes}
        category={browseRecipesCategory}
        searchQuery={browseRecipesSearch}
        onCategoryChange={setBrowseRecipesCategory}
        onSearchChange={setBrowseRecipesSearch}
        onClose={() => {
          setShowBrowseRecipes(false);
          setBrowseRecipesSearch('');
          setBrowseRecipesCategory('All');
        }}
        onSelectRecipe={(recipe) => {
          setLogRecipe(recipe);
          setShowLogRecipeModal(true);
          setLogMeal('Lunch');
          setLogQuantity(1);
          setLogSuccess(false);
          setShowBrowseRecipes(false);
        }}
      />

      {/* Log Recipe Modal */}
      <LogRecipeModal
        visible={showLogRecipeModal}
        recipe={logRecipe}
        meal={logMeal}
        quantity={logQuantity}
        success={logSuccess}
        onMealChange={setLogMeal}
        onQuantityChange={setLogQuantity}
        onSave={() => {
          if (logRecipe) {
            addFood(logRecipe, logMeal);
            setLogSuccess(true);
            setTimeout(() => {
              setShowLogRecipeModal(false);
              setLogRecipe(null);
              setLogMeal('Lunch');
              setLogQuantity(1);
              setLogSuccess(false);
            }, 1500);
          }
        }}
        onCancel={() => {
          setShowLogRecipeModal(false);
          setLogRecipe(null);
          setLogMeal('Lunch');
          setLogQuantity(1);
          setLogSuccess(false);
        }}
        onClose={() => {
          setShowLogRecipeModal(false);
          setLogRecipe(null);
          setLogMeal('Lunch');
          setLogQuantity(1);
          setLogSuccess(false);
        }}
      />
    </SafeAreaView>
  );
}

// Add Food Modal Component
function AddFoodModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    if (!form.name || !form.calories || !form.totalFat || !form.totalCarbs || !form.protein) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');
    try {
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
      Alert.alert('Success', 'Food/ingredient added!');
      onClose();
      setStep(1);
      setForm({
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
    } catch (e) {
      setError('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.addFoodModalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Food / Ingredient</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.addFoodModalScroll} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View style={styles.addFoodStep}>
                <Text style={styles.addFoodStepTitle}>Basic Information</Text>
                <TextInput
                  style={styles.addFoodInput}
                  placeholder="Food Name*"
                  value={form.name}
                  onChangeText={(value) => handleChange('name', value)}
                />
                <TextInput
                  style={styles.addFoodInput}
                  placeholder="Brand (optional)"
                  value={form.brand}
                  onChangeText={(value) => handleChange('brand', value)}
                />
                <TextInput
                  style={styles.addFoodInput}
                  placeholder="Barcode (optional)"
                  value={form.barcode}
                  onChangeText={(value) => handleChange('barcode', value)}
                  keyboardType="numeric"
                />
                <View style={styles.addFoodSelectContainer}>
                  <Text style={styles.addFoodLabel}>Serving Size:</Text>
                  <View style={styles.addFoodSelect}>
                    {['100g', '100ml', '1cup'].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.addFoodSelectOption,
                          form.servingSize === size && styles.addFoodSelectOptionActive,
                        ]}
                        onPress={() => handleChange('servingSize', size)}
                      >
                        <Text
                          style={[
                            styles.addFoodSelectOptionText,
                            form.servingSize === size && styles.addFoodSelectOptionTextActive,
                          ]}
                        >
                          per {size}
              </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.addFoodButton, !form.name && styles.addFoodButtonDisabled]}
                  onPress={() => setStep(2)}
                  disabled={!form.name}
                >
                  <Text style={styles.addFoodButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.addFoodStep}>
                <Text style={styles.addFoodStepTitle}>Nutrition Information</Text>
                <View style={styles.addFoodGrid}>
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Calories (kcal)*"
                    value={form.calories}
                    onChangeText={(value) => handleChange('calories', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Total Fat (g)*"
                    value={form.totalFat}
                    onChangeText={(value) => handleChange('totalFat', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Saturated Fat (g)"
                    value={form.saturatedFat}
                    onChangeText={(value) => handleChange('saturatedFat', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Monounsaturated Fat (g)"
                    value={form.monounsaturatedFat}
                    onChangeText={(value) => handleChange('monounsaturatedFat', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Polyunsaturated Fat (g)"
                    value={form.polyunsaturatedFat}
                    onChangeText={(value) => handleChange('polyunsaturatedFat', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Trans Fat (g)"
                    value={form.transFat}
                    onChangeText={(value) => handleChange('transFat', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Total Carbs (g)*"
                    value={form.totalCarbs}
                    onChangeText={(value) => handleChange('totalCarbs', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Fiber (g)"
                    value={form.fiber}
                    onChangeText={(value) => handleChange('fiber', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Sugar (g)"
                    value={form.sugar}
                    onChangeText={(value) => handleChange('sugar', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Protein (g)*"
                    value={form.protein}
                    onChangeText={(value) => handleChange('protein', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Sodium (mg)"
                    value={form.sodium}
                    onChangeText={(value) => handleChange('sodium', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.addFoodGridInput}
                    placeholder="Cholesterol (mg)"
                    value={form.cholesterol}
                    onChangeText={(value) => handleChange('cholesterol', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.addFoodButtons}>
                  <TouchableOpacity style={styles.addFoodButtonSecondary} onPress={() => setStep(1)}>
                    <Text style={styles.addFoodButtonSecondaryText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addFoodButton,
                      (!form.calories || !form.totalFat || !form.totalCarbs || !form.protein) &&
                        styles.addFoodButtonDisabled,
                    ]}
                    onPress={() => setStep(3)}
                    disabled={!form.calories || !form.totalFat || !form.totalCarbs || !form.protein}
                  >
                    <Text style={styles.addFoodButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.addFoodStep}>
                <Text style={styles.addFoodStepTitle}>Review & Save</Text>
                <View style={styles.addFoodReview}>
                  <Text style={styles.addFoodReviewName}>{form.name}</Text>
                  {form.brand && <Text style={styles.addFoodReviewText}>Brand: {form.brand}</Text>}
                  {form.barcode && <Text style={styles.addFoodReviewText}>Barcode: {form.barcode}</Text>}
                  <Text style={styles.addFoodReviewText}>Serving Size: {form.servingSize}</Text>
                </View>
                <View style={styles.addFoodMacros}>
                  <View style={styles.addFoodMacroItem}>
                    <Text style={styles.addFoodMacroLabel}>Calories</Text>
                    <Text style={styles.addFoodMacroValue}>{form.calories || 0}</Text>
                  </View>
                  <View style={styles.addFoodMacroItem}>
                    <Text style={styles.addFoodMacroLabel}>Protein</Text>
                    <Text style={styles.addFoodMacroValue}>{form.protein || 0}g</Text>
                  </View>
                  <View style={styles.addFoodMacroItem}>
                    <Text style={styles.addFoodMacroLabel}>Carbs</Text>
                    <Text style={styles.addFoodMacroValue}>{form.totalCarbs || 0}g</Text>
                  </View>
                  <View style={styles.addFoodMacroItem}>
                    <Text style={styles.addFoodMacroLabel}>Fat</Text>
                    <Text style={styles.addFoodMacroValue}>{form.totalFat || 0}g</Text>
                  </View>
                </View>
                {error && <Text style={styles.addFoodError}>{error}</Text>}
                <View style={styles.addFoodButtons}>
                  <TouchableOpacity style={styles.addFoodButtonSecondary} onPress={() => setStep(2)}>
                    <Text style={styles.addFoodButtonSecondaryText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addFoodButton, saving && styles.addFoodButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    <Text style={styles.addFoodButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
    </Modal>
  );
}

// Browse Recipes Modal Component
function BrowseRecipesModal({
  visible,
  recipes,
  loading,
  category,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onClose,
  onSelectRecipe,
}: {
  visible: boolean;
  recipes: any[];
  loading: boolean;
  category: string;
  searchQuery: string;
  onCategoryChange: (cat: string) => void;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  onSelectRecipe: (recipe: any) => void;
}) {
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Vegetarian', 'High Protein', 'Low Carb'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Browse Recipes</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <View style={styles.browseRecipesSearch}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.browseRecipesSearchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.browseRecipesCategories}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.browseRecipesCategory, category === cat && styles.browseRecipesCategoryActive]}
              onPress={() => onCategoryChange(cat)}
            >
              <Text
                style={[styles.browseRecipesCategoryText, category === cat && styles.browseRecipesCategoryTextActive]}
              >
                {cat}
                </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.browseRecipesList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : recipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
            </View>
          ) : (
            <View style={styles.browseRecipesGrid}>
              {recipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.browseRecipeCard}
                  onPress={() => onSelectRecipe(recipe)}
                >
                  <View style={styles.browseRecipeImage}>
                    <Ionicons name="restaurant" size={32} color="#94a3b8" />
                  </View>
                  <Text style={styles.browseRecipeName} numberOfLines={2}>
                    {recipe.title || recipe.name}
                  </Text>
                  <View style={styles.browseRecipeMacros}>
                    <Text style={styles.browseRecipeMacro}>
                      {Math.round(recipe.calories || recipe.nutrition?.calories || 0)} cal
                    </Text>
                    <Text style={styles.browseRecipeMacro}>
                      {Math.round(recipe.protein || recipe.nutrition?.protein || 0)}g P
                </Text>
              </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Create Recipe Modal Component - Full Implementation
function CreateRecipeModal({
  visible,
  onClose,
  onRecipeCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onRecipeCreated: (recipe: any) => void;
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
  const [saveLoading, setSaveLoading] = useState(false);
  const [totalWeight, setTotalWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('g');

  const UNIT_OPTIONS = ['g', 'ml', 'cup', 'tbsp', 'tsp', 'piece'];

  // Helper: get grams per serving for a food
  const getGramsPerServing = (servingSize: string, name: string) => {
    const known = [
      { name: /rice/i, unit: 'cup', grams: 158 },
      { name: /oats/i, unit: 'cup', grams: 81 },
      { name: /black beans/i, unit: 'cup', grams: 172 },
      { name: /chicken breast/i, unit: 'piece', grams: 120 },
    ];
    for (const k of known) {
      if (name.match(k.name) && servingSize.includes(k.unit)) return k.grams;
    }
    const match = servingSize.match(/(\d+\.?\d*)\s*(g|ml|cup|tbsp|tsp|piece)/i);
    if (match) {
      const amount = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'g' || unit === 'ml') return amount;
      if (unit === 'cup') return 240 * amount;
      if (unit === 'tbsp') return 15 * amount;
      if (unit === 'tsp') return 5 * amount;
      if (unit === 'piece') return 50 * amount;
    }
    return 100;
  };

  const autoMatchIngredients = async () => {
    setMatchingLoading(true);
    const lines = bulkIngredients.split('\n').map((l) => l.trim()).filter(Boolean);
    const matches: any[] = [];
    for (const line of lines) {
      try {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .ilike('name', `%${line}%`)
          .limit(1);
        
        if (!error && data && data.length > 0) {
          matches.push({ ...data[0], original: line, quantity: 1, unit: 'g' });
        } else {
          matches.push({ name: line, unmatched: true, quantity: 1, unit: 'g' });
        }
      } catch (err) {
        matches.push({ name: line, unmatched: true, quantity: 1, unit: 'g' });
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
    setMatchedIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, ...newData } : ing)));
  };

  const removeMatchedIngredient = (idx: number) => {
    setMatchedIngredients((prev) => prev.filter((_, i) => i !== idx));
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

  const calculateMacros = () => {
    return matchedIngredients.reduce(
      (total, ing) => {
        if (ing.unmatched) return total;
        const userUnit = ing.unit || (ing.serving_size && ing.serving_size.match(/ml|g|cup|tbsp|tsp|piece/i)?.[0]?.toLowerCase()) || 'g';
        const userQty = ing.quantity;
        const gramsPerServing = getGramsPerServing(ing.serving_size || '', ing.name || '');
        let factor = 1;
        if (userUnit === 'g' || userUnit === 'ml') {
          factor = userQty / gramsPerServing;
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
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleSaveRecipe = async () => {
    setSaveLoading(true);
    try {
      const totalMacros = matchedIngredients.reduce(
        (total, ing) => {
          if (ing.unmatched) return total;
          const userUnit = ing.unit || (ing.serving_size && ing.serving_size.match(/ml|g|cup|tbsp|tsp|piece/i)?.[0]?.toLowerCase()) || 'g';
          const userQty = ing.quantity;
          const gramsPerServing = getGramsPerServing(ing.serving_size || '', ing.name || '');
          let factor = 1;
          if (userUnit === 'g' || userUnit === 'ml') {
            factor = userQty / gramsPerServing;
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
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      const servings = recipeForm.servings || 1;
      const perServing = {
        calories: totalMacros.calories / servings,
        protein: totalMacros.protein / servings,
        carbs: totalMacros.carbs / servings,
        fat: totalMacros.fat / servings,
      };
      const nutrition = { total: totalMacros, perServing };
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          name: recipeForm.name,
          servings: recipeForm.servings,
          ingredients: JSON.stringify(matchedIngredients.map((ing) => ({
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
        onRecipeCreated(data);
        setRecipeForm({ name: '', servings: 1, ingredients: [] });
        setBulkIngredients('');
        setMatchedIngredients([]);
        setStep(1);
        setBulkImportEnabled(false);
        onClose();
      } else {
        Alert.alert('Error', 'Failed to save recipe.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save recipe.');
    }
    setSaveLoading(false);
  };

  const servings = recipeForm.servings || 1;
  const macros = calculateMacros();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.createRecipeModalContent} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Recipe</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.createRecipeScroll} showsVerticalScrollIndicator={false}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <View style={styles.createRecipeForm}>
              <Text style={styles.createRecipeLabel}>Recipe Name*</Text>
              <TextInput
                style={styles.createRecipeInput}
                placeholder="e.g. Chicken Stir Fry"
                value={recipeForm.name}
                onChangeText={(value) => setRecipeForm({ ...recipeForm, name: value })}
              />

              <Text style={styles.createRecipeLabel}>Servings*</Text>
              <TextInput
                style={styles.createRecipeInput}
                placeholder="e.g. 4"
                value={recipeForm.servings.toString()}
                onChangeText={(value) => setRecipeForm({ ...recipeForm, servings: parseInt(value) || 1 })}
                keyboardType="numeric"
              />

              <View style={styles.createRecipeCheckboxContainer}>
                <Text style={styles.createRecipeLabel}>Bulk Ingredients Import</Text>
                <TouchableOpacity
                  style={styles.createRecipeCheckbox}
                  onPress={() => setBulkImportEnabled(!bulkImportEnabled)}
                >
                  {bulkImportEnabled && <Ionicons name="checkbox" size={24} color="#f97316" />}
                  {!bulkImportEnabled && <Ionicons name="square-outline" size={24} color="#64748b" />}
                </TouchableOpacity>
              </View>

              {bulkImportEnabled && (
                <View style={styles.createRecipeBulkContainer}>
                  <Text style={styles.createRecipeLabel}>Paste or type your ingredients (one per line):</Text>
                  <TextInput
                    style={styles.createRecipeTextArea}
                    placeholder="e.g. 2 chicken breasts\n1 cup broccoli\n1 tbsp olive oil"
                    value={bulkIngredients}
                    onChangeText={setBulkIngredients}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  <Text style={styles.createRecipeNote}>We'll match them to foods in our database.</Text>
                </View>
              )}

              <View style={styles.createRecipeButtons}>
                <TouchableOpacity style={styles.createRecipeCancelButton} onPress={onClose}>
                  <Text style={styles.createRecipeCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.createRecipeSaveButton,
                    (!recipeForm.name || !recipeForm.servings) && styles.createRecipeSaveButtonDisabled,
                  ]}
                  onPress={handleNextStep1}
                  disabled={!recipeForm.name || !recipeForm.servings}
                >
                  <Text style={styles.createRecipeSaveText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Ingredient Matching */}
          {step === 2 && (
            <View style={styles.createRecipeForm}>
              <Text style={styles.createRecipeSectionTitle}>Ingredients</Text>
              {matchingLoading ? (
                <View style={styles.createRecipeLoading}>
                  <ActivityIndicator size="large" color="#f97316" />
                  <Text style={styles.createRecipeLoadingText}>Matching ingredients...</Text>
                </View>
              ) : (
                <ScrollView style={styles.createRecipeIngredientsList} nestedScrollEnabled>
                  {matchedIngredients.length === 0 && (
                    <Text style={styles.createRecipeEmptyText}>No ingredients found. Go back and add some.</Text>
                  )}
                  {matchedIngredients.map((ing, idx) => (
                    <View key={idx} style={styles.createRecipeIngredientItem}>
                      <View style={styles.createRecipeIngredientRow}>
                        <TextInput
                          style={styles.createRecipeIngredientQty}
                          value={ing.quantity?.toString() || '1'}
                          onChangeText={(value) => updateMatchedIngredient(idx, { quantity: parseFloat(value) || 1 })}
                          keyboardType="numeric"
                        />
                        <View style={styles.createRecipeIngredientUnit}>
                          {UNIT_OPTIONS.map((unit) => (
                            <TouchableOpacity
                              key={unit}
                              style={[
                                styles.createRecipeUnitOption,
                                (ing.unit || 'g') === unit && styles.createRecipeUnitOptionActive,
                              ]}
                              onPress={() => updateMatchedIngredient(idx, { unit })}
                            >
                              <Text
                                style={[
                                  styles.createRecipeUnitText,
                                  (ing.unit || 'g') === unit && styles.createRecipeUnitTextActive,
                                ]}
                              >
                                {unit}
              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.createRecipeIngredientName}>
                          <Text style={styles.createRecipeIngredientNameText} numberOfLines={1}>
                            {ing.name}
                          </Text>
                          {ing.serving_size && (
                            <Text style={styles.createRecipeIngredientServing}>({ing.serving_size})</Text>
                          )}
                          {ing.unmatched && (
                            <Text style={styles.createRecipeIngredientUnmatched}>(unmatched)</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.createRecipeIngredientDelete}
                          onPress={() => removeMatchedIngredient(idx)}
                        >
                          <Ionicons name="trash" size={18} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                      {!ing.unmatched && (
                        <View style={styles.createRecipeIngredientMacros}>
                          <TextInput
                            style={styles.createRecipeIngredientMacroInput}
                            value={(ing.calories || 0).toString()}
                            onChangeText={(value) => updateMatchedIngredient(idx, { calories: parseFloat(value) || 0 })}
                            keyboardType="numeric"
                            placeholder="cal"
                          />
                          <Text style={styles.createRecipeIngredientMacroLabel}>cal,</Text>
                          <TextInput
                            style={styles.createRecipeIngredientMacroInput}
                            value={(ing.protein || 0).toString()}
                            onChangeText={(value) => updateMatchedIngredient(idx, { protein: parseFloat(value) || 0 })}
                            keyboardType="numeric"
                            placeholder="P"
                          />
                          <Text style={styles.createRecipeIngredientMacroLabel}>g P,</Text>
                          <TextInput
                            style={styles.createRecipeIngredientMacroInput}
                            value={(ing.carbs || 0).toString()}
                            onChangeText={(value) => updateMatchedIngredient(idx, { carbs: parseFloat(value) || 0 })}
                            keyboardType="numeric"
                            placeholder="C"
                          />
                          <Text style={styles.createRecipeIngredientMacroLabel}>g C,</Text>
                          <TextInput
                            style={styles.createRecipeIngredientMacroInput}
                            value={(ing.fat || 0).toString()}
                            onChangeText={(value) => updateMatchedIngredient(idx, { fat: parseFloat(value) || 0 })}
                            keyboardType="numeric"
                            placeholder="F"
                          />
                          <Text style={styles.createRecipeIngredientMacroLabel}>g F</Text>
                        </View>
                      )}
                      {ing.unmatched && (
                        <View style={styles.createRecipeIngredientSearch}>
                          <TextInput
                            style={styles.createRecipeIngredientSearchInput}
                            placeholder="Search manually..."
                            onBlur={(e) => handleManualSearch(idx, e.nativeEvent.text)}
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={styles.createRecipeButtons}>
                <TouchableOpacity style={styles.createRecipeCancelButton} onPress={() => setStep(1)}>
                  <Text style={styles.createRecipeCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.createRecipeSaveButton,
                    (matchedIngredients.length === 0 || matchedIngredients.some((ing) => ing.unmatched)) &&
                      styles.createRecipeSaveButtonDisabled,
                  ]}
                  onPress={() => setStep(3)}
                  disabled={matchedIngredients.length === 0 || matchedIngredients.some((ing) => ing.unmatched)}
                >
                  <Text style={styles.createRecipeSaveText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Review & Save */}
          {step === 3 && (
            <View style={styles.createRecipeForm}>
              <Text style={styles.createRecipeSectionTitle}>Review & Save</Text>
              <View style={styles.createRecipeReview}>
                <View style={styles.createRecipeReviewItem}>
                  <Text style={styles.createRecipeReviewLabel}>Recipe Name:</Text>
                  <Text style={styles.createRecipeReviewValue}>{recipeForm.name}</Text>
                </View>
                <View style={styles.createRecipeReviewItem}>
                  <Text style={styles.createRecipeReviewLabel}>Servings:</Text>
                  <Text style={styles.createRecipeReviewValue}>{recipeForm.servings}</Text>
                </View>
                <View style={styles.createRecipeReviewItem}>
                  <Text style={styles.createRecipeReviewLabel}>Ingredients:</Text>
                  <View style={styles.createRecipeReviewIngredients}>
                    {matchedIngredients.map((ing, idx) => (
                      <Text key={idx} style={styles.createRecipeReviewIngredient}>
                        {ing.quantity} {ing.unit || 'g'} {ing.name}
                        {ing.serving_size && <Text style={styles.createRecipeReviewIngredientNote}> ({ing.serving_size})</Text>}
                        <Text style={styles.createRecipeReviewIngredientMacro}>
                          {' '}
                          - {ing.calories || 0} cal, {ing.protein || 0}g P, {ing.carbs || 0}g C, {ing.fat || 0}g F
                        </Text>
                      </Text>
                    ))}
                  </View>
                </View>
                <View style={styles.createRecipeReviewItem}>
                  <Text style={styles.createRecipeReviewLabel}>Macros (per serving):</Text>
                  <Text style={styles.createRecipeReviewValue}>
                    Calories: {Math.round(macros.calories / servings)} kcal
                  </Text>
                  <Text style={styles.createRecipeReviewValue}>
                    Protein: {Math.round(macros.protein / servings)} g
                  </Text>
                  <Text style={styles.createRecipeReviewValue}>Carbs: {Math.round(macros.carbs / servings)} g</Text>
                  <Text style={styles.createRecipeReviewValue}>Fat: {Math.round(macros.fat / servings)} g</Text>
                </View>
              </View>
              <View style={styles.createRecipeButtons}>
                <TouchableOpacity style={styles.createRecipeCancelButton} onPress={() => setStep(2)}>
                  <Text style={styles.createRecipeCancelText}>Back</Text>
                </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.createRecipeSaveButton, saveLoading && styles.createRecipeSaveButtonDisabled]}
                  onPress={handleSaveRecipe}
                  disabled={saveLoading}
                >
                  <Text style={styles.createRecipeSaveText}>{saveLoading ? 'Saving...' : 'Save Recipe'}</Text>
              </TouchableOpacity>
            </View>
          </View>
      )}
    </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Log Recipe Modal Component
function LogRecipeModal({
  visible,
  recipe,
  meal,
  quantity,
  success,
  onMealChange,
  onQuantityChange,
  onSave,
  onCancel,
  onClose,
}: {
  visible: boolean;
  recipe: any;
  meal: string;
  quantity: number;
  success: boolean;
  onMealChange: (meal: string) => void;
  onQuantityChange: (qty: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  if (!recipe) return null;
  const perServing = recipe.nutrition?.perServing || recipe.nutrition || {
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fat: recipe.fat || 0,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.logRecipeModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Recipe to Meal</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={styles.logRecipeSuccess}>
              <View style={styles.logRecipeSuccessIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
              </View>
              <Text style={styles.logRecipeSuccessTitle}>Recipe Logged!</Text>
              <Text style={styles.logRecipeSuccessText}>Your recipe has been added to {meal}</Text>
            </View>
          ) : (
            <View style={styles.logRecipeBody}>
              <View style={styles.logRecipeInfo}>
                <Text style={styles.logRecipeName}>{recipe.title || recipe.name}</Text>
                <Text style={styles.logRecipeMacros}>
                  {Math.round(perServing.calories)} cal • {Math.round(perServing.protein)}g protein •{' '}
                  {Math.round(perServing.carbs)}g carbs • {Math.round(perServing.fat)}g fat
                </Text>
              </View>

              <View style={styles.logRecipeField}>
                <Text style={styles.logRecipeLabel}>Meal</Text>
                <View style={styles.logRecipeSelect}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.logRecipeSelectOption, meal === m && styles.logRecipeSelectOptionActive]}
                      onPress={() => onMealChange(m)}
                    >
                      <Text
                        style={[
                          styles.logRecipeSelectOptionText,
                          meal === m && styles.logRecipeSelectOptionTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.logRecipeField}>
                <Text style={styles.logRecipeLabel}>Quantity (servings)</Text>
                <View style={styles.logRecipeQuantity}>
                  <TouchableOpacity
                    style={styles.logRecipeQuantityButton}
                    onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#64748b" />
                  </TouchableOpacity>
                  <Text style={styles.logRecipeQuantityValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.logRecipeQuantityButton}
                    onPress={() => onQuantityChange(quantity + 1)}
                  >
                    <Ionicons name="add" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.logRecipeButtons}>
                <TouchableOpacity style={styles.logRecipeCancelButton} onPress={onCancel}>
                  <Text style={styles.logRecipeCancelText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logRecipeSaveButton} onPress={onSave}>
                  <Text style={styles.logRecipeSaveText}>Log to {meal}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
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
    fontSize: 28,
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
  calendarContainer: {
    gap: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarItem: {
    flex: 1,
    alignItems: 'center',
  },
  calendarDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  calendarDateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDateButtonSelected: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  calendarDateTextSelected: {
    color: '#ffffff',
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
  },
  calendarDotActive: {
    backgroundColor: '#16a34a',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  nutritionLabel: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 8,
    minHeight: 14,
  },
  nutritionRemaining: {
    fontSize: isSmallScreen ? 9 : 11,
    color: '#64748b',
    marginTop: 4,
    minHeight: 12,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  waterSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  addWaterButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addWaterButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  waterProgress: {
    flexDirection: 'row',
    gap: 4,
  },
  waterGlass: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  waterGlassFilled: {
    backgroundColor: '#3b82f6',
  },
  mealsSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  mealTotals: {
    fontSize: 12,
    color: '#64748b',
  },
  mealAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealEntries: {
    gap: 8,
  },
  mealEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  mealEntryLeft: {
    flex: 1,
  },
  mealEntryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  mealEntryQuantity: {
    fontSize: 12,
    color: '#64748b',
  },
  mealEntryRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  mealEntryMacros: {
    fontSize: 11,
    color: '#64748b',
  },
  deleteEntryButton: {
    marginTop: 4,
    padding: 4,
  },
  emptyMeal: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyMealText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    marginTop: 8,
  },
  addMealText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
    fontWeight: '600',
    color: '#1e293b',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 40,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  searchResults: {
    gap: 12,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  foodItemBrand: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  foodItemNutrition: {
    fontSize: 12,
    color: '#64748b',
  },
  foodItemAdd: {
    marginLeft: 12,
  },
  recipesList: {
    gap: 12,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  recipeItemContent: {
    flex: 1,
  },
  recipeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  recipeItemServings: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  recipeItemMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  recipeItemMacro: {
    fontSize: 11,
    color: '#64748b',
  },
  deleteRecipeButton: {
    padding: 8,
  },
  addRecipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  createRecipeButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  createRecipeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  createRecipeSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  // Water Modal
  waterModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  waterModalBody: {
    padding: 20,
  },
  waterModalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  waterModalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  waterUnitGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  waterUnitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  waterUnitButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  waterUnitButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  waterUnitButtonTextSelected: {
    color: '#ffffff',
  },
  waterPreview: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  waterPreviewText: {
    fontSize: 12,
    color: '#2563eb',
  },
  waterModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  waterModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  waterModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  waterModalAddButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  waterModalAddButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  waterModalAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Photo Modal
  photoModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  photoModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  photoModalText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  photoModalButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  photoModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Recipe Modal
  recipeModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  recipeModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  recipeModalText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  recipeModalButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  recipeModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Add Food Modal
  addFoodModalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  addFoodModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  addFoodModalText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addFoodModalButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addFoodModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Add Food Modal - Full Styles
  addFoodModalScroll: {
    flex: 1,
    padding: 20,
  },
  addFoodStep: {
    gap: 16,
  },
  addFoodStepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  addFoodInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  addFoodSelectContainer: {
    marginTop: 8,
  },
  addFoodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  addFoodSelect: {
    flexDirection: 'row',
    gap: 8,
  },
  addFoodSelectOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  addFoodSelectOptionActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  addFoodSelectOptionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  addFoodSelectOptionTextActive: {
    color: '#ffffff',
  },
  addFoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  addFoodGridInput: {
    width: (width - 64) / 2,
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  addFoodButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addFoodButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f97316',
    borderRadius: 12,
    alignItems: 'center',
  },
  addFoodButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addFoodButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addFoodButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  addFoodButtonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  addFoodReview: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addFoodReviewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  addFoodReviewText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  addFoodMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  addFoodMacroItem: {
    alignItems: 'center',
  },
  addFoodMacroLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  addFoodMacroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addFoodError: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  // Browse Recipes Modal
  browseRecipesSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    position: 'relative',
  },
  browseRecipesSearchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 40,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  browseRecipesCategories: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  browseRecipesCategory: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  browseRecipesCategoryActive: {
    backgroundColor: '#f97316',
  },
  browseRecipesCategoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  browseRecipesCategoryTextActive: {
    color: '#ffffff',
  },
  browseRecipesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  browseRecipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  browseRecipeCard: {
    width: (width - 64) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  browseRecipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  browseRecipeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  browseRecipeMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  browseRecipeMacro: {
    fontSize: 11,
    color: '#64748b',
  },
  // Log Recipe Modal
  logRecipeModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  logRecipeSuccess: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logRecipeSuccessIcon: {
    marginBottom: 16,
  },
  logRecipeSuccessTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  logRecipeSuccessText: {
    fontSize: 14,
    color: '#64748b',
  },
  logRecipeBody: {
    gap: 20,
  },
  logRecipeInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  logRecipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  logRecipeMacros: {
    fontSize: 14,
    color: '#64748b',
  },
  logRecipeField: {
    gap: 8,
  },
  logRecipeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logRecipeSelect: {
    flexDirection: 'row',
    gap: 8,
  },
  logRecipeSelectOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  logRecipeSelectOptionActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  logRecipeSelectOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  logRecipeSelectOptionTextActive: {
    color: '#ffffff',
  },
  logRecipeQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logRecipeQuantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logRecipeQuantityValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 40,
    textAlign: 'center',
  },
  logRecipeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  logRecipeCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  logRecipeCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  logRecipeSaveButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f97316',
    borderRadius: 12,
    alignItems: 'center',
  },
  logRecipeSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Create Recipe Modal
  createRecipeModalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  createRecipeScroll: {
    flex: 1,
    padding: 20,
  },
  createRecipeForm: {
    gap: 16,
  },
  createRecipeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  createRecipeInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  createRecipeSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 12,
  },
  createRecipeCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  createRecipeCheckbox: {
    padding: 4,
  },
  createRecipeBulkContainer: {
    marginTop: 12,
    gap: 8,
  },
  createRecipeTextArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
  },
  createRecipeNote: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  createRecipeLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  createRecipeLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  createRecipeEmptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94a3b8',
    paddingVertical: 20,
  },
  createRecipeIngredientsList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  createRecipeIngredientItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  createRecipeIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  createRecipeIngredientQty: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  createRecipeIngredientUnit: {
    flexDirection: 'row',
    gap: 4,
  },
  createRecipeUnitOption: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  createRecipeUnitOptionActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  createRecipeUnitText: {
    fontSize: 11,
    color: '#64748b',
  },
  createRecipeUnitTextActive: {
    color: '#ffffff',
  },
  createRecipeIngredientName: {
    flex: 1,
  },
  createRecipeIngredientNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  createRecipeIngredientServing: {
    fontSize: 11,
    color: '#64748b',
  },
  createRecipeIngredientUnmatched: {
    fontSize: 11,
    color: '#dc2626',
  },
  createRecipeIngredientDelete: {
    padding: 4,
  },
  createRecipeIngredientMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  createRecipeIngredientMacroInput: {
    width: 50,
    height: 28,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 6,
    fontSize: 11,
    backgroundColor: '#ffffff',
  },
  createRecipeIngredientMacroLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  createRecipeIngredientSearch: {
    marginTop: 8,
  },
  createRecipeIngredientSearchInput: {
    height: 36,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    backgroundColor: '#ffffff',
  },
  createRecipeReview: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  createRecipeReviewItem: {
    gap: 4,
  },
  createRecipeReviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  createRecipeReviewValue: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  createRecipeReviewIngredients: {
    marginLeft: 8,
    gap: 4,
  },
  createRecipeReviewIngredient: {
    fontSize: 13,
    color: '#64748b',
  },
  createRecipeReviewIngredientNote: {
    fontSize: 11,
    color: '#94a3b8',
  },
  createRecipeReviewIngredientMacro: {
    fontSize: 11,
    color: '#94a3b8',
  },
  createRecipeMacros: {
    gap: 12,
  },
  createRecipeMacroInput: {
    gap: 8,
  },
  createRecipeMacroLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  createRecipeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  createRecipeCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  createRecipeCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  createRecipeSaveButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f97316',
    borderRadius: 12,
    alignItems: 'center',
  },
  createRecipeSaveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  createRecipeSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
