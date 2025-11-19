// src/services/aimind.ts
// AIMind analytics: Mood, Sleep, Habits analysis

import { supabase } from '../lib/supabaseClient';

// Analyze mood trends
export async function analyzeMood(userId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('mood_logs')
    .select('mood, created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      avg: 3,
      trend: 'stable',
      count: 0,
    };
  }

  const avg = data.reduce((sum, log) => sum + log.mood, 0) / data.length;
  const recent = data.slice(0, 3).reduce((sum, log) => sum + log.mood, 0) / Math.min(3, data.length);
  const older = data.slice(3).reduce((sum, log) => sum + log.mood, 0) / Math.max(1, data.length - 3);

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recent > older + 0.5) trend = 'improving';
  else if (recent < older - 0.5) trend = 'declining';

  return {
    avg: Math.round(avg * 10) / 10,
    trend,
    count: data.length,
    recent: Math.round(recent * 10) / 10,
  };
}

// Analyze sleep trends
export async function analyzeSleep(userId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('hours, quality, date')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      avg: 7,
      quality_avg: 3,
      trend: 'stable',
      count: 0,
    };
  }

  const avg = data.reduce((sum, log) => sum + parseFloat(log.hours.toString()), 0) / data.length;
  const quality_avg = data.reduce((sum, log) => sum + (log.quality || 3), 0) / data.length;
  
  const recent = data.slice(0, 3).reduce((sum, log) => sum + parseFloat(log.hours.toString()), 0) / Math.min(3, data.length);
  const older = data.slice(3).reduce((sum, log) => sum + parseFloat(log.hours.toString()), 0) / Math.max(1, data.length - 3);

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recent > older + 0.5) trend = 'improving';
  else if (recent < older - 0.5) trend = 'declining';

  return {
    avg: Math.round(avg * 10) / 10,
    quality_avg: Math.round(quality_avg * 10) / 10,
    trend,
    count: data.length,
    recent: Math.round(recent * 10) / 10,
  };
}

// Analyze habit completion
export async function analyzeHabits(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split('T')[0];

  // Get user habits
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId);

  if (habitsError) throw habitsError;

  if (!habits || habits.length === 0) {
    return {
      completion: 100,
      total_habits: 0,
      completed_today: 0,
    };
  }

  const habitIds = habits.map((h) => h.id);

  // Get habit logs for last 7 days
  const { data: logs, error: logsError } = await supabase
    .from('habit_logs')
    .select('habit_id, date, completed')
    .in('habit_id', habitIds)
    .gte('date', startDate)
    .lte('date', today);

  if (logsError) throw logsError;

  // Calculate completion rate
  const totalPossible = habits.length * 7; // 7 days
  const completed = logs?.filter((log) => log.completed).length || 0;
  const completion = totalPossible > 0 ? (completed / totalPossible) * 100 : 100;

  // Today's completion
  const todayLogs = logs?.filter((log) => log.date === today && log.completed) || [];
  const completed_today = todayLogs.length;

  return {
    completion: Math.round(completion),
    total_habits: habits.length,
    completed_today,
    total_possible: totalPossible,
    completed_total: completed,
  };
}

// Get meditation count (last 7 days)
export async function getMeditationCount(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Check both meditation_sessions (Module C) and meditation_sessions_ac (Module AC)
  const [moduleC, moduleAC] = await Promise.all([
    supabase
      .from('meditation_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString()),
    supabase
      .from('meditation_sessions_ac')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString()),
  ]);

  const count = (moduleC.data?.length || 0) + (moduleAC.data?.length || 0);
  return count;
}

// Get mind game performance (last 10 sessions)
export async function getMindGamePerformance(userId: string) {
  const { data, error } = await supabase
    .from('mind_game_sessions')
    .select('score, metrics, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      avg_score: 50,
      reaction_penalty: 0,
      focus_penalty: 0,
      count: 0,
    };
  }

  const scores = data.map((g) => g.score || 0).filter((s) => s > 0);
  const avg_score = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 50;

  let reaction_penalty = 0;
  let focus_penalty = 0;

  data.forEach((game) => {
    if (game.score < 30) reaction_penalty += 5;
    if (game.score < 10) focus_penalty += 3;
    
    // Check metrics for reaction time
    if (game.metrics && typeof game.metrics === 'object') {
      const reactionTime = (game.metrics as any).reaction_time_ms || (game.metrics as any).reactionTime;
      if (reactionTime && reactionTime > 500) {
        reaction_penalty += 3;
      }
    }
  });

  return {
    avg_score: Math.round(avg_score),
    reaction_penalty,
    focus_penalty,
    count: data.length,
  };
}

