// src/pages/Recipes.tsx
// Recipes Page - Browse, search, and create AI recipes
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Recipes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiRequest, setAiRequest] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('recipes').select('*');
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const searchRecipes = async () => {
    loadRecipes(); // Reuse loadRecipes with searchTerm
  };

  const generateAIRecipe = async () => {
    try {
      setGenerating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // AI recipe generation - use Supabase RPC or Edge Function
      // For now, create a placeholder recipe
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          name: `AI Recipe: ${aiRequest.substring(0, 50)}`,
          description: `Generated from: ${aiRequest}`,
          servings: 4,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        navigate(`/recipes/${data.id}`);
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
    } finally {
      setGenerating(false);
      setShowAIBuilder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍽️ Recipes</Text>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => setShowAIBuilder(true)}
        >
          <Text style={styles.aiButtonText}>✨ AI Builder</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={searchRecipes}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchRecipes}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* AI Builder Modal */}
      {showAIBuilder && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✨ AI Recipe Builder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., High-protein dinner under 500 calories"
              value={aiRequest}
              onChangeText={setAiRequest}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAIBuilder(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateAIRecipe}
                disabled={generating || !aiRequest.trim()}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>Generate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Recipe Grid */}
      <View style={styles.recipeGrid}>
        {recipes.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            style={styles.recipeCard}
            onPress={() => navigate(`/recipes/${recipe.id}`)}
          >
            {recipe.image_url && (
              <View style={styles.recipeImage}>
                <Text style={styles.imagePlaceholder}>📷</Text>
              </View>
            )}
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {recipe.description}
            </Text>
            <View style={styles.recipeMeta}>
              <Text style={styles.recipeCalories}>{recipe.calories} cal</Text>
              <Text style={styles.recipeProtein}>{recipe.protein}g protein</Text>
            </View>
            {recipe.tags && recipe.tags.length > 0 && (
              <View style={styles.recipeTags}>
                {recipe.tags.slice(0, 2).map((tag: string, idx: number) => (
                  <Text key={idx} style={styles.recipeTag}>{tag}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {recipes.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recipes found</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowAIBuilder(true)}
          >
            <Text style={styles.createButtonText}>Create Your First Recipe</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  aiButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  recipeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePlaceholder: {
    fontSize: 40,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recipeCalories: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recipeProtein: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  recipeTags: {
    flexDirection: 'row',
    gap: 4,
  },
  recipeTag: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
