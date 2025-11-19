// src/hooks/usePlan.ts
// React Native hook for fetching personalized plans

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useUser } from '../context/UserContext';

export interface PersonalizedPlan {
  meta: {
    generatedAt: string;
    userId: number;
    bmr: number;
    tdee: number;
    calorieTarget: number;
  };
  nutrition: {
    calories: number;
    macros: {
      proteinG: number;
      carbsG: number;
      fatG: number;
    };
    meals: Array<{
      id: number;
      calories: number;
      suggested: string[];
    }>;
  };
  workouts: Array<{
    id: number;
    title: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
    }>;
    notes: string;
  }>;
  wellness: Array<{
    type: string;
    duration: number;
    action: string;
  }>;
  recommendations: Array<{
    sku: string;
    title: string;
    category: string;
  }>;
}

export default function usePlan() {
  const { profile } = useUser();
  const [plan, setPlan] = useState<PersonalizedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Note: In production, userId should come from authenticated session
      // For now, we'll use the profile ID from context
      const response = await fetch(`${API_ENDPOINTS.PERSONALIZED_PLAN}?userId=${profile.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }

      const data = await response.json();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const regeneratePlan = async (): Promise<PersonalizedPlan | null> => {
    if (!profile?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.REGENERATE_PLAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate plan');
      }

      const data = await response.json();
      setPlan(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error regenerating plan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchPlan();
    }
  }, [profile?.id]);

  return { plan, loading, error, refresh: fetchPlan, regenerate: regeneratePlan };
}


