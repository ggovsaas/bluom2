import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_IMAGE = 'https://cdn.pixabay.com/photo/2017/01/20/15/06/food-1995056_1280.png'; // visually appealing food illustration

const MyRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMeal, setLogMeal] = useState('Lunch');
  const [logQuantity, setLogQuantity] = useState(1);
  const [logSuccess, setLogSuccess] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*');
        
        if (error) throw error;
        // Only user-created recipes have a 'name' property (not 'title')
        setRecipes((data || []).filter((r: any) => r.name && !r.title));
      } catch (e) {
        setRecipes([]);
      }
      setLoading(false);
    };
    fetchRecipes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-6 pt-12 pb-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">My Recipes</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No recipes yet. Create one from the Fuel page!</div>
      ) : (
        <ul className="space-y-4">
          {recipes.map((recipe) => (
            <li
              key={recipe.id}
              className="flex items-center bg-white rounded-xl shadow p-4 cursor-pointer hover:bg-blue-50 transition"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-800 text-lg">{recipe.name}</div>
                <div className="text-sm text-gray-500 mb-1">Servings: {recipe.servings}</div>
                <div className="flex space-x-4 text-xs text-gray-600">
                  <span>Calories: {Math.round(recipe.nutrition?.perServing?.calories ?? recipe.nutrition?.calories ?? 0)}</span>
                  <span>Protein: {Math.round(recipe.nutrition?.perServing?.protein ?? recipe.nutrition?.protein ?? 0)}g</span>
                  <span>Carbs: {Math.round(recipe.nutrition?.perServing?.carbs ?? recipe.nutrition?.carbs ?? 0)}g</span>
                  <span>Fat: {Math.round(recipe.nutrition?.perServing?.fat ?? recipe.nutrition?.fat ?? 0)}g</span>
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this recipe?')) {
                    try {
                      const { error } = await supabase
                        .from('recipes')
                        .delete()
                        .eq('id', recipe.id);
                      
                      if (error) throw error;
                      setRecipes(recipes.filter((r) => r.id !== recipe.id));
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
      )}

      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{selectedRecipe.name}</h3>
              <button onClick={() => setSelectedRecipe(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><span className="text-xl">×</span></button>
            </div>
            <div className="text-center mb-2 text-gray-700">Servings: {selectedRecipe.servings}</div>
            <div className="flex justify-center space-x-4 mb-4 text-xs text-gray-600">
              <span>Calories: {Math.round((selectedRecipe.nutrition?.perServing?.calories ?? selectedRecipe.nutrition?.calories ?? 0))}</span>
              <span>Protein: {Math.round((selectedRecipe.nutrition?.perServing?.protein ?? selectedRecipe.nutrition?.protein ?? 0))}g</span>
              <span>Carbs: {Math.round((selectedRecipe.nutrition?.perServing?.carbs ?? selectedRecipe.nutrition?.carbs ?? 0))}g</span>
              <span>Fat: {Math.round((selectedRecipe.nutrition?.perServing?.fat ?? selectedRecipe.nutrition?.fat ?? 0))}g</span>
            </div>
            <button onClick={() => { setShowLogModal(true); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 mb-2">Log to Meal</button>
            <button onClick={() => setSelectedRecipe(null)} className="w-full py-2 border border-gray-300 rounded-xl font-medium text-gray-700">Close</button>
          </div>
        </div>
      )}

      {showLogModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Log Recipe to Meal</h3>
              <button onClick={() => setShowLogModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><span className="text-xl">×</span></button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="font-medium text-gray-800">{selectedRecipe.name}</p>
              <p className="text-sm text-gray-600">
                {Math.round((selectedRecipe.nutrition?.perServing?.calories ?? selectedRecipe.nutrition?.calories ?? 0))} cal • {Math.round((selectedRecipe.nutrition?.perServing?.protein ?? selectedRecipe.nutrition?.protein ?? 0))}g protein • {Math.round((selectedRecipe.nutrition?.perServing?.carbs ?? selectedRecipe.nutrition?.carbs ?? 0))}g carbs • {Math.round((selectedRecipe.nutrition?.perServing?.fat ?? selectedRecipe.nutrition?.fat ?? 0))}g fat
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal</label>
              <select value={logMeal} onChange={e => setLogMeal(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (servings)</label>
              <input type="number" min="1" value={logQuantity} onChange={e => setLogQuantity(parseInt(e.target.value) || 1)} className="w-full p-3 border border-gray-300 rounded-xl" />
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowLogModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700">Cancel</button>
              <button
                onClick={() => {
                  // Log the recipe as a food entry (per serving)
                  // You may need to call a context or prop function here
                  setShowLogModal(false);
                  setSelectedRecipe(null);
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                Log to {logMeal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRecipes; 