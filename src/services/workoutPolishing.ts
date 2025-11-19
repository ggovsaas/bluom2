// src/services/workoutPolishing.ts
// Workout Engine Polishing - Auto-regulation, alternatives, recovery integration

import { supabase } from '../lib/supabaseClient';

// ============ EXERCISE ALTERNATIVES ============

export async function getExerciseAlternatives(exerciseId: number) {
  const { data, error } = await supabase.rpc('get_exercise_alternatives', {
    p_exercise_id: exerciseId,
  });

  if (error) throw error;
  return data || [];
}

export async function suggestAlternative(
  userId: string,
  exerciseId: number,
  reason: 'equipment' | 'injury' | 'preference' | 'difficulty'
) {
  const alternatives = await getExerciseAlternatives(exerciseId);
  
  if (alternatives.length === 0) {
    return null;
  }

  // Return highest priority alternative
  return alternatives[0];
}

// ============ AUTO-REGULATION ============

export async function autoRegulateWorkout(
  userId: string,
  workoutLogId: number,
  recoveryScore: number,
  rpe?: number
) {
  const { data, error } = await supabase.rpc('auto_regulate_workout', {
    p_user_id: userId,
    p_workout_log_id: workoutLogId,
    p_recovery_score: recoveryScore,
    p_rpe: rpe || null,
  });

  if (error) throw error;
  return data || [];
}

// ============ WEEKLY TRAINING GOALS ============

export async function createWeeklyGoal(
  userId: string,
  weekNumber: number,
  weekStartDate: string,
  targetVolume: number,
  targetFrequency: number,
  targetIntensity?: number
) {
  const { data, error } = await supabase
    .from('weekly_training_goals')
    .upsert({
      user_id: userId,
      week_number: weekNumber,
      week_start_date: weekStartDate,
      target_volume: targetVolume,
      target_frequency: targetFrequency,
      target_intensity: targetIntensity || null,
    }, {
      onConflict: 'user_id,week_number,week_start_date',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWeeklyGoalProgress(
  goalId: string,
  actualVolume: number,
  actualFrequency: number,
  actualIntensity?: number
) {
  const { data, error } = await supabase
    .from('weekly_training_goals')
    .update({
      actual_volume: actualVolume,
      actual_frequency: actualFrequency,
      actual_intensity: actualIntensity || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWeeklyGoal(
  userId: string,
  weekStartDate: string
) {
  const { data, error } = await supabase
    .from('weekly_training_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function markWeeklyGoalComplete(goalId: string) {
  const { error } = await supabase
    .from('weekly_training_goals')
    .update({ completed: true })
    .eq('id', goalId);

  if (error) throw error;
}

export async function shouldAutoRepeatWeek(userId: string, weekStartDate: string) {
  const goal = await getWeeklyGoal(userId, weekStartDate);
  
  if (!goal) return false;

  const volumeCompletion = goal.actual_volume / goal.target_volume;
  const frequencyCompletion = goal.actual_frequency / goal.target_frequency;

  // If less than 70% completion, suggest repeat
  return volumeCompletion < 0.7 || frequencyCompletion < 0.7;
}

// ============ EXERCISE SEARCH ============

export async function searchExercises(
  query: string,
  filters?: {
    equipment?: string;
    muscleGroup?: string;
    difficulty?: string;
  }
) {
  let supabaseQuery = supabase
    .from('exercise_db')
    .select('*');

  // Full text search
  if (query) {
    supabaseQuery = supabaseQuery.textSearch('searchable', query, {
      type: 'websearch',
    });
  }

  // Filters
  if (filters?.equipment) {
    supabaseQuery = supabaseQuery.eq('equipment', filters.equipment);
  }
  if (filters?.muscleGroup) {
    supabaseQuery = supabaseQuery.eq('muscle_group', filters.muscleGroup);
  }

  const { data, error } = await supabaseQuery.limit(20);

  if (error) throw error;
  return data || [];
}

// ============ AUTO-REGULATION HISTORY ============

export async function getAutoRegulationHistory(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('workout_auto_regulations')
    .select(`
      *,
      exercise_db (name, muscle_group),
      workout_logs (created_at)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

