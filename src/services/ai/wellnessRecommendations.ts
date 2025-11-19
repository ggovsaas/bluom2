// src/services/ai/wellnessRecommendations.ts
// Wellness AI Recommendations Engine - "Do this next..." system

import { supabase } from '../../lib/supabaseClient';
import { computeStressScore, getLatestStressScore } from './stressEngine';
import { analyzeMood, analyzeSleep, analyzeHabits, getMeditationCount } from '../aimind';

export interface WellnessRecommendation {
  id?: string;
  category: 'stress' | 'sleep' | 'mood' | 'meditation' | 'habits' | 'games';
  text: string;
  priority: 'low' | 'medium' | 'high';
  action_type?: string;
  action_data?: any;
}

export async function getWellnessRecommendations(userId: string): Promise<{
  stress: { score: number; level: string };
  recommendations: WellnessRecommendation[];
}> {
  // Get or compute stress score
  let stress = await getLatestStressScore(userId);
  if (!stress) {
    stress = await computeStressScore(userId);
  }

  // Get additional context
  const [mood, sleep, habits, meditationCount] = await Promise.all([
    analyzeMood(userId),
    analyzeSleep(userId),
    analyzeHabits(userId),
    getMeditationCount(userId, 7),
  ]);

  const recommendations: WellnessRecommendation[] = [];

  // Stress-based recommendations
  if (stress.level === 'high') {
    recommendations.push({
      category: 'stress',
      text: 'Take a 5-minute breathing session to reset your mind',
      priority: 'high',
      action_type: 'meditation',
      action_data: { duration: 5, type: 'breathing' },
    });
    recommendations.push({
      category: 'games',
      text: 'Play a focus game for 1 minute to clear your mind',
      priority: 'high',
      action_type: 'game',
      action_data: { type: 'focus', duration: 60 },
    });
    if (sleep.avg < 6) {
      recommendations.push({
        category: 'sleep',
        text: 'Your sleep is low. Try a sleep meditation before bed',
        priority: 'high',
        action_type: 'meditation',
        action_data: { type: 'sleep', duration: 10 },
      });
    }
  } else if (stress.level === 'moderate') {
    recommendations.push({
      category: 'meditation',
      text: 'Try a 3-minute soundscape to relax',
      priority: 'medium',
      action_type: 'meditation',
      action_data: { type: 'soundscape', duration: 3 },
    });
    recommendations.push({
      category: 'mood',
      text: 'Log your mood to track how you're feeling',
      priority: 'medium',
      action_type: 'mood_log',
    });
    if (habits.completion < 60) {
      recommendations.push({
        category: 'habits',
        text: `Complete ${habits.total_habits - habits.completed_today} more habits today`,
        priority: 'medium',
        action_type: 'habit_complete',
      });
    }
  } else {
    // Low stress
    recommendations.push({
      category: 'meditation',
      text: 'Try a new meditation level to level up',
      priority: 'low',
      action_type: 'meditation',
      action_data: { type: 'level_up' },
    });
    recommendations.push({
      category: 'habits',
      text: 'Set a new habit goal for today',
      priority: 'low',
      action_type: 'habit_create',
    });
    if (meditationCount < 3) {
      recommendations.push({
        category: 'meditation',
        text: 'Build your meditation streak - you\'re doing great!',
        priority: 'low',
        action_type: 'meditation',
        action_data: { type: 'streak' },
      });
    }
  }

  // Sleep-based recommendations
  if (sleep.avg < 6) {
    recommendations.push({
      category: 'sleep',
      text: `You've been sleeping ${sleep.avg}h on average. Aim for 7-8h for better recovery`,
      priority: 'high',
      action_type: 'sleep_log',
    });
  } else if (sleep.avg > 9) {
    recommendations.push({
      category: 'sleep',
      text: 'You\'re getting plenty of sleep! Keep it up',
      priority: 'low',
      action_type: 'sleep_log',
    });
  }

  // Mood-based recommendations
  if (mood.avg <= 2) {
    recommendations.push({
      category: 'mood',
      text: 'Your mood has been low. Try a gratitude exercise or journal entry',
      priority: 'high',
      action_type: 'gratitude',
    });
  } else if (mood.trend === 'declining') {
    recommendations.push({
      category: 'mood',
      text: 'Your mood trend is declining. A quick meditation might help',
      priority: 'medium',
      action_type: 'meditation',
      action_data: { duration: 5 },
    });
  }

  // Habit-based recommendations
  if (habits.completion < 50 && habits.total_habits > 0) {
    recommendations.push({
      category: 'habits',
      text: `Your habit completion is ${habits.completion}%. Try to complete at least 60%`,
      priority: 'medium',
      action_type: 'habits',
    });
  }

  // Save recommendations to database
  if (recommendations.length > 0) {
    const recsToInsert = recommendations.map((rec) => ({
      user_id: userId,
      category: rec.category,
      text: rec.text,
      priority: rec.priority,
      action_type: rec.action_type,
      action_data: rec.action_data || {},
    }));

    await supabase.from('ai_recommendations_wellness').insert(recsToInsert);
  }

  return {
    stress: {
      score: stress.score,
      level: stress.level,
    },
    recommendations,
  };
}

// Get active recommendations
export async function getActiveRecommendations(userId: string) {
  const { data, error } = await supabase
    .from('ai_recommendations_wellness')
    .select('*')
    .eq('user_id', userId)
    .eq('seen', false)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

// Mark recommendation as seen
export async function markRecommendationSeen(recommendationId: string) {
  const { error } = await supabase
    .from('ai_recommendations_wellness')
    .update({ seen: true })
    .eq('id', recommendationId);

  if (error) throw error;
}

