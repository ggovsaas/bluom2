// src/pages/Recipes.tsx
// Recipes Page - Browse and search recipes

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Recipes() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to MyRecipes which has the full implementation
    navigate('/my-recipes', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Recipes...</h2>
        <p className="text-gray-600">Redirecting to your recipes</p>
      </div>
    </div>
  );
}
