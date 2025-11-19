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

interface Recipe {
  id: number;
  title?: string;
  name?: string;
  image?: string;
  cookTime?: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  rating?: number;
  reviews?: number;
  ingredients?: string[];
  instructions?: string[];
  saved?: boolean;
  category?: string;
  isPremium?: boolean;
}

export default function RecipesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { profile, getCurrentDate, addFoodEntry } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<number[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logRecipe, setLogRecipe] = useState<Recipe | null>(null);
  const [logMeal, setLogMeal] = useState('Lunch');
  const [logQuantity, setLogQuantity] = useState(1);
  const [logSuccess, setLogSuccess] = useState(false);
  const [accessedRecipes, setAccessedRecipes] = useState<number[]>([]);

  const mealOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Vegetarian', 'High Protein', 'Low Carb'];

  // Check if user can access recipe (3 free limit for non-premium)
  const canAccessRecipe = (recipeId: number) => {
    if (profile?.isPremium) return true;
    return accessedRecipes.includes(recipeId) || accessedRecipes.length < 3;
  };

  // Fetch recipes from Supabase
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        let query = supabase.from('recipes').select('*');
        
        // Filter by category if not 'All'
        if (selectedCategory !== 'All') {
          query = query.eq('category', selectedCategory);
        }
        
        // Filter by search query if provided
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setRecipes(data || []);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [selectedCategory, searchQuery]);

  const toggleSaveRecipe = (recipeId: number) => {
    setSavedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    if (!canAccessRecipe(recipe.id) && !profile?.isPremium) {
      Alert.alert(
        'Premium Required',
        'You\'ve reached your limit of 3 free recipes. Upgrade to Premium for unlimited access!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Premium' as never) },
        ]
      );
      return;
    }

    if (!accessedRecipes.includes(recipe.id)) {
      setAccessedRecipes([...accessedRecipes, recipe.id]);
    }
    setSelectedRecipe(recipe);
  };

  const handleLogRecipe = (recipe: Recipe) => {
    setLogRecipe(recipe);
    setShowLogModal(true);
    setLogMeal('Lunch');
    setLogQuantity(1);
    setLogSuccess(false);
  };

  const handleLogSubmit = () => {
    if (!logRecipe) return;
    addFoodEntry({
      id: `${logRecipe.id}-${Date.now()}`,
      foodId: logRecipe.id,
      name: logRecipe.title || logRecipe.name || 'Recipe',
      calories: logRecipe.calories,
      protein: logRecipe.protein,
      carbs: logRecipe.carbs,
      fat: logRecipe.fat,
      quantity: logQuantity,
      meal: logMeal,
      date: getCurrentDate(),
    });
    setLogSuccess(true);
    setTimeout(() => {
      setShowLogModal(false);
      setLogRecipe(null);
    }, 1200);
  };

  // Recipe Detail View
  if (selectedRecipe) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
            <TouchableOpacity
              onPress={() => setSelectedRecipe(null)}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
              <Text style={styles.backText}>Back to Recipes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleSaveRecipe(selectedRecipe.id)}
              style={[
                styles.saveButton,
                savedRecipes.includes(selectedRecipe.id) && styles.saveButtonActive
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={savedRecipes.includes(selectedRecipe.id) ? 'heart' : 'heart-outline'}
                size={20}
                color={savedRecipes.includes(selectedRecipe.id) ? '#ffffff' : '#1e293b'}
              />
            </TouchableOpacity>
          </View>

          {/* Recipe Image */}
          <View style={styles.recipeImageContainer}>
            {selectedRecipe.image ? (
              <Image source={{ uri: selectedRecipe.image }} style={styles.recipeImage} />
            ) : (
              <View style={styles.recipeImagePlaceholder}>
                <Ionicons name="restaurant" size={48} color="#94a3b8" />
              </View>
            )}
            {selectedRecipe.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={14} color="#ffffff" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>

          {/* Recipe Info */}
          <View style={styles.card}>
            <Text style={styles.recipeTitle}>{selectedRecipe.title || selectedRecipe.name}</Text>
            
            <View style={styles.recipeMeta}>
              {selectedRecipe.rating && (
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.metaText}>{selectedRecipe.rating}</Text>
                  <Text style={styles.metaSubtext}>({selectedRecipe.reviews || 0})</Text>
                </View>
              )}
              {selectedRecipe.cookTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#64748b" />
                  <Text style={styles.metaText}>{selectedRecipe.cookTime} min</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color="#64748b" />
                <Text style={styles.metaText}>{selectedRecipe.servings} servings</Text>
              </View>
            </View>

            {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {selectedRecipe.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Nutrition Facts */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition Facts (per serving)</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: '#2563eb' }]}>{selectedRecipe.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: '#dc2626' }]}>{selectedRecipe.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: '#16a34a' }]}>{selectedRecipe.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: '#d97706' }]}>{selectedRecipe.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ingredients</Text>
              {selectedRecipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Instructions */}
          {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Instructions</Text>
              {selectedRecipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Log to Meal Button */}
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => handleLogRecipe(selectedRecipe)}
            activeOpacity={0.7}
          >
            <Text style={styles.logButtonText}>Log to Meal</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Log to Meal Modal */}
        <Modal visible={showLogModal} animationType="slide" transparent={true} onRequestClose={() => setShowLogModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Recipe to Meal</Text>
              <Text style={styles.modalRecipeName}>{logRecipe?.title || logRecipe?.name}</Text>
              
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Meal</Text>
                <View style={styles.mealPicker}>
                  {mealOptions.map(meal => (
                    <TouchableOpacity
                      key={meal}
                      style={[styles.mealOption, logMeal === meal && styles.mealOptionActive]}
                      onPress={() => setLogMeal(meal)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.mealOptionText, logMeal === meal && styles.mealOptionTextActive]}>
                        {meal}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Quantity</Text>
                <TextInput
                  style={styles.modalInput}
                  value={String(logQuantity)}
                  onChangeText={(text) => setLogQuantity(Number(text) || 1)}
                  keyboardType="numeric"
                />
              </View>

              {logSuccess ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
                  <Text style={styles.successText}>Logged!</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleLogSubmit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>Log</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Recipe List View
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View>
            <Text style={styles.title}>Recipes</Text>
            <Text style={styles.subtitle}>Healthy & delicious meal ideas</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Fuel' as never)}
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
              placeholder="Search recipes..."
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
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingText}>Loading delicious recipes...</Text>
          </View>
        )}

        {/* Recipe Grid */}
        {!loading && recipes.length > 0 && (
          <View style={styles.recipesGrid}>
            {recipes.map((recipe) => {
              const canAccess = canAccessRecipe(recipe.id);
              return (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => handleSelectRecipe(recipe)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recipeCardImageContainer}>
                    {recipe.image ? (
                      <Image source={{ uri: recipe.image }} style={styles.recipeCardImage} />
                    ) : (
                      <View style={styles.recipeCardImagePlaceholder}>
                        <Ionicons name="restaurant" size={32} color="#94a3b8" />
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.recipeCardSaveButton,
                        savedRecipes.includes(recipe.id) && styles.recipeCardSaveButtonActive
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSaveRecipe(recipe.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={savedRecipes.includes(recipe.id) ? 'heart' : 'heart-outline'}
                        size={16}
                        color={savedRecipes.includes(recipe.id) ? '#ffffff' : '#1e293b'}
                      />
                    </TouchableOpacity>
                    {recipe.difficulty && (
                      <View style={styles.difficultyBadge}>
                        <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
                      </View>
                    )}
                    {!canAccess && !profile?.isPremium && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color="#ffffff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.recipeCardContent}>
                    <Text style={styles.recipeCardTitle} numberOfLines={2}>
                      {recipe.title || recipe.name}
                    </Text>

                    <View style={styles.recipeCardMeta}>
                      {recipe.cookTime && (
                        <View style={styles.recipeCardMetaItem}>
                          <Ionicons name="time-outline" size={14} color="#64748b" />
                          <Text style={styles.recipeCardMetaText}>{recipe.cookTime}m</Text>
                        </View>
                      )}
                      <View style={styles.recipeCardMetaItem}>
                        <Ionicons name="people-outline" size={14} color="#64748b" />
                        <Text style={styles.recipeCardMetaText}>{recipe.servings}</Text>
                      </View>
                      {recipe.rating && (
                        <View style={styles.recipeCardMetaItem}>
                          <Ionicons name="star" size={14} color="#f59e0b" />
                          <Text style={styles.recipeCardMetaText}>{recipe.rating}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.recipeCardMacros}>
                      <View style={styles.recipeCardMacro}>
                        <Text style={[styles.recipeCardMacroValue, { color: '#2563eb' }]}>{recipe.calories}</Text>
                        <Text style={styles.recipeCardMacroLabel}>cal</Text>
                      </View>
                      <View style={styles.recipeCardMacro}>
                        <Text style={[styles.recipeCardMacroValue, { color: '#dc2626' }]}>{recipe.protein}g</Text>
                        <Text style={styles.recipeCardMacroLabel}>protein</Text>
                      </View>
                      <View style={styles.recipeCardMacro}>
                        <Text style={[styles.recipeCardMacroValue, { color: '#16a34a' }]}>{recipe.carbs}g</Text>
                        <Text style={styles.recipeCardMacroLabel}>carbs</Text>
                      </View>
                      <View style={styles.recipeCardMacro}>
                        <Text style={[styles.recipeCardMacroValue, { color: '#d97706' }]}>{recipe.fat}g</Text>
                        <Text style={styles.recipeCardMacroLabel}>fat</Text>
                      </View>
                    </View>

                    {recipe.tags && recipe.tags.length > 0 && (
                      <View style={styles.recipeCardTags}>
                        {recipe.tags.slice(0, 2).map((tag) => (
                          <View key={tag} style={styles.recipeCardTag}>
                            <Text style={styles.recipeCardTagText}>{tag}</Text>
                          </View>
                        ))}
                        {recipe.tags.length > 2 && (
                          <View style={styles.recipeCardTag}>
                            <Text style={styles.recipeCardTagText}>+{recipe.tags.length - 2}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.recipeCardLogButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (canAccess || profile?.isPremium) {
                          handleLogRecipe(recipe);
                        } else {
                          Alert.alert(
                            'Premium Required',
                            'Upgrade to Premium to log this recipe!',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Upgrade', onPress: () => navigation.navigate('Premium' as never) },
                            ]
                          );
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recipeCardLogButtonText}>Log to Meal</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {!loading && recipes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
          </View>
        )}

        {/* Premium CTA for Free Users */}
        {!profile?.isPremium && accessedRecipes.length >= 3 && (
          <View style={styles.premiumCard}>
            <Ionicons name="star" size={32} color="#f59e0b" />
            <Text style={styles.premiumCardTitle}>Unlock Unlimited Recipes</Text>
            <Text style={styles.premiumCardText}>
              You've used your 3 free recipes. Upgrade to Premium for unlimited access!
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
    backgroundColor: '#f97316',
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
    backgroundColor: '#f97316',
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
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  recipeCard: {
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
  recipeCardImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  recipeCardImage: {
    width: '100%',
    height: '100%',
  },
  recipeCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeCardSaveButton: {
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
  recipeCardSaveButtonActive: {
    backgroundColor: '#dc2626',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  difficultyText: {
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
  recipeCardContent: {
    padding: 12,
  },
  recipeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  recipeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  recipeCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeCardMetaText: {
    fontSize: 12,
    color: '#64748b',
  },
  recipeCardMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recipeCardMacro: {
    alignItems: 'center',
    flex: 1,
  },
  recipeCardMacroValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recipeCardMacroLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  recipeCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  recipeCardTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
  },
  recipeCardTagText: {
    fontSize: 10,
    color: '#f97316',
  },
  recipeCardLogButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  recipeCardLogButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
  recipeImageContainer: {
    width: '100%',
    height: 240,
    marginBottom: 16,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
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
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  recipeMeta: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  ingredientText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  instructionText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
    paddingTop: 6,
  },
  logButton: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalRecipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 24,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  mealPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  mealOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  mealOptionText: {
    fontSize: 14,
    color: '#64748b',
  },
  mealOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  modalButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 12,
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
