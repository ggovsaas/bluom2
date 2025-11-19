import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PieChart as MacroPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const UNIT_OPTIONS = ['g', 'ml', 'cup', 'tbsp', 'tsp', 'piece'];
const MACRO_COLORS = ['#ef4444', '#3b82f6', '#eab308']; // Protein, Carbs, Fat

const CreateRecipe: React.FC = () => {
  const navigate = useNavigate();
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

  // Step 2: Automatic ingredient matching
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

  // Step 1 -> Step 2 handler
  const handleNextStep1 = async () => {
    if (bulkImportEnabled) {
      await autoMatchIngredients();
    } else {
      setMatchedIngredients([...recipeForm.ingredients]);
    }
    setStep(2);
  };

  // Ingredient editing handlers
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

  // Macro calculation
  const UNIT_GRAM_EQUIV: Record<string, number> = { g: 1, ml: 1, cup: 240, tbsp: 15, tsp: 5, piece: 50 };
  const calculateMacros = () => {
    return matchedIngredients.reduce((total, ing) => {
      if (ing.unmatched) return total;
      const base = UNIT_GRAM_EQUIV[ing.unit || 'g'] || 1;
      let factor = ing.quantity;
      if (ing.serving_size && ing.serving_size.match(/100/)) {
        factor = (ing.quantity * base) / 100;
      } else if (ing.serving_size && ing.serving_size.match(/ml|g|cup|tbsp|tsp|piece/i)) {
        const match = ing.serving_size.match(/(\d+\.?\d*)/);
        if (match) {
          factor = (ing.quantity * base) / parseFloat(match[1]);
        }
      }
      return {
        calories: total.calories + (ing.calories || 0) * factor,
        protein: total.protein + (ing.protein || 0) * factor,
        carbs: total.carbs + (ing.carbs || 0) * factor,
        fat: total.fat + (ing.fat || 0) * factor,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Save recipe
  const handleSaveRecipe = async () => {
    setSaveLoading(true);
    try {
      const totalMacros = calculateMacros();
      const perServing = {
        calories: totalMacros.calories / servings,
        protein: totalMacros.protein / servings,
        carbs: totalMacros.carbs / servings,
        fat: totalMacros.fat / servings
      };
      
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
          nutrition: JSON.stringify({ total: totalMacros, perServing })
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        alert('Recipe saved successfully!');
        navigate('/recipes');
      } else {
        alert('Failed to save recipe.');
      }
    } catch (err) {
      alert('Failed to save recipe.');
    }
    setSaveLoading(false);
  };

  // Macro chart data
  const macros = calculateMacros();
  const servings = recipeForm.servings || 1;
  const macroChartData = [
    { name: 'Protein', value: macros.protein / servings },
    { name: 'Carbs', value: macros.carbs / servings },
    { name: 'Fat', value: macros.fat / servings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Macro Dashboard */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Recipe</h2>
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">Calories</span>
                <span className="text-2xl font-bold text-blue-600">{Math.round(macros.calories / servings) || 0}</span>
                <span className="text-xs text-gray-500">kcal / serving</span>
              </div>
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <MacroPieChart width={128} height={128}>
                    <Pie
                      data={macroChartData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      label={({ name, value }) => `${name}: ${Math.round(value ?? 0)}g`}
                    >
                      {MACRO_COLORS.map((color, idx) => (
                        <Cell key={idx} fill={color} />
                      ))}
                    </Pie>
                  </MacroPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: MACRO_COLORS[0] }}></span>
                  <span className="text-sm">Protein</span>
                  <span className="font-bold ml-2">{Math.round(macros.protein / servings) || 0}g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: MACRO_COLORS[1] }}></span>
                  <span className="text-sm">Carbs</span>
                  <span className="font-bold ml-2">{Math.round(macros.carbs / servings) || 0}g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: MACRO_COLORS[2] }}></span>
                  <span className="text-sm">Fat</span>
                  <span className="font-bold ml-2">{Math.round(macros.fat / servings) || 0}g</span>
                </div>
              </div>
            </div>
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
                  onClick={() => navigate(-1)}
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
};

export default CreateRecipe; 