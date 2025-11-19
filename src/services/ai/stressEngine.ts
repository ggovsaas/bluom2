// src/services/ai/stressEngine.ts
// Stress AI Engine - Core algorithm for stress scoring

import { supabase } from '../../lib/supabaseClient';
import { analyzeMood, analyzeSleep, analyzeHabits, getMeditationCount, getMindGamePerformance } from '../aimind';

export interface StressScore {
  score: number;
  level: 'low' | 'moderate' | 'high';
  factors: {
    mood_impact: number;
    sleep_impact: number;
    habit_impact: number;
    meditation_impact: number;
    game_impact: number;
  };
}

export async function computeStressScore(userId: string): Promise<StressScore> {
  // Get all wellness data
  const [mood, sleep, habits, meditationCount, gamePerformance] = await Promise.all([
    analyzeMood(userId),
    analyzeSleep(userId),
    analyzeHabits(userId),
    getMeditationCount(userId, 7),
    getMindGamePerformance(userId),
  ]);

  // Start at 50 (neutral)
  let score = 50;
  const factors = {
    mood_impact: 0,
    sleep_impact: 0,
    habit_impact: 0,
    meditation_impact: 0,
    game_impact: 0,
  };

  // Mood impact
  if (mood.avg <= 2) {
    factors.mood_impact = 20;
    score += 20;
  } else if (mood.avg <= 2.5) {
    factors.mood_impact = 10;
    score += 10;
  } else if (mood.avg >= 4) {
    factors.mood_impact = -10;
    score -= 10;
  } else if (mood.avg >= 3.5) {
    factors.mood_impact = -5;
    score -= 5;
  }

  // Sleep impact
  if (sleep.avg < 6) {
    factors.sleep_impact = 20;
    score += 20;
  } else if (sleep.avg < 6.5) {
    factors.sleep_impact = 10;
    score += 10;
  } else if (sleep.avg > 7.5) {
    factors.sleep_impact = -10;
    score -= 10;
  } else if (sleep.avg > 7) {
    factors.sleep_impact = -5;
    score -= 5;
  }

  // Habit impact
  if (habits.completion < 40) {
    factors.habit_impact = 10;
    score += 10;
  } else if (habits.completion < 60) {
    factors.habit_impact = 5;
    score += 5;
  } else if (habits.completion > 75) {
    factors.habit_impact = -5;
    score -= 5;
  }

  // Meditation reduces stress
  const meditationReduction = meditationCount * 3;
  factors.meditation_impact = -meditationReduction;
  score -= meditationReduction;

  // Game performance penalties
  const gamePenalty = gamePerformance.reaction_penalty + gamePerformance.focus_penalty;
  factors.game_impact = gamePenalty;
  score += gamePenalty;

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: 'low' | 'moderate' | 'high';
  if (score < 33) {
    level = 'low';
  } else if (score < 66) {
    level = 'moderate';
  } else {
    level = 'high';
  }

  // Save stress score
  await supabase.from('stress_scores').insert({
    user_id: userId,
    level,
    score,
    factors,
  });

  // Update user state cache
  await supabase.rpc('update_user_state_cache', {
    p_user_id: userId,
    p_stress_level: level,
    p_stress_score: score,
    p_mood_trend: mood.trend,
    p_sleep_trend: sleep.trend,
    p_habit_completion_rate: habits.completion,
    p_meditation_streak: 0, // Will be updated by streak engine
  });

  return {
    score,
    level,
    factors,
  };
}

// Get latest stress score
export async function getLatestStressScore(userId: string): Promise<StressScore | null> {
  const { data, error } = await supabase
    .from('stress_scores')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    score: data.score,
    level: data.level as 'low' | 'moderate' | 'high',
    factors: data.factors || {
      mood_impact: 0,
      sleep_impact: 0,
      habit_impact: 0,
      meditation_impact: 0,
      game_impact: 0,
    },
  };
}

// Get stress history
export async function getStressHistory(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('stress_scores')
    .select('*')
    .eq('user_id', userId)
    .gte('generated_at', startDate.toISOString())
    .order('generated_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

