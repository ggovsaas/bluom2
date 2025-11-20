// src/pages/Recipes.tsx
// Recipes Page - Browse, search, and create AI recipes (WEB VERSION)

import React, { useState, useEffect } from 'react';
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

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

      if (error) throw error;

      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchRecipes = () => {
    loadRecipes();
  };

  const generateAIRecipe = async () => {
    if (!aiRequest.trim()) return;

    try {
      setGenerating(true);
      // TODO: Call AI recipe generation endpoint
      alert('AI Recipe generation coming soon!');
      setShowAIBuilder(false);
      setAiRequest('');
    } catch (error) {
      console.error('Error generating recipe:', error);
      alert('Failed to generate recipe');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🍽️ Recipes</h1>
          <button
            onClick={() => setShowAIBuilder(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ✨ AI Builder
          </button>
        </div>

        {/* Search */}
        <div className="mb-8 flex gap-2">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchRecipes()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={searchRecipes}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            🔍
          </button>
        </div>

        {/* AI Builder Modal */}
        {showAIBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">✨ AI Recipe Builder</h2>
              <textarea
                placeholder="e.g., High-protein dinner under 500 calories"
                value={aiRequest}
                onChange={(e) => setAiRequest(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAIBuilder(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateAIRecipe}
                  disabled={generating || !aiRequest.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              {recipe.image_url && (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-6xl">📷</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {recipe.title || recipe.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {recipe.description}
                </p>
                <div className="flex gap-4 text-sm text-gray-500 mb-2">
                  <span>{recipe.calories || recipe.total_calories || 0} cal</span>
                  <span>{recipe.protein || recipe.total_protein || 0}g protein</span>
                </div>
                {recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.slice(0, 2).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {recipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No recipes found</p>
            <p className="text-gray-400 mt-2">Try creating one with the AI Builder!</p>
          </div>
        )}
      </div>
    </div>
  );
}
