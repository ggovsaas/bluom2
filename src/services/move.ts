// src/services/move.ts
// Move system: Exercises, Workouts, Workout Logs, Steps

import { supabase } from '../lib/supabaseClient';

// ============ EXERCISES ============

export async function getExercises(userId: string) {
  const { data, error } = await supabase
    .from('exercise_db')
    .select(`
      *,
      exercise_categories (*)
    `)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getExercisesByCategory(userId: string, categoryId?: string) {
  let query = supabase
    .from('exercise_db')
    .select(`
      *,
      exercise_categories (*)
    `)
    .or(`user_id.eq.${userId},user_id.is.null`);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data || [];
}

export async function getExerciseCategories() {
  const { data, error } = await supabase
    .from('exercise_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function addCustomExercise(
  userId: string,
  exercise: {
    name: string;
    category_id?: string;
    muscle_group?: string;
    equipment?: string;
    video_url?: string;
    instructions?: string;
    muscles?: string[];
  }
) {
  const { data, error } = await supabase
    .from('exercise_db')
    .insert({
      ...exercise,
      user_id: userId,
      is_custom: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ WORKOUTS ============

export async function createWorkout(
  userId: string,
  name: string,
  goal?: string
) {
  const { data, error } = await supabase
    .from('workout_routines')
    .insert({
      user_id: userId,
      title: name,
      description: goal,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserWorkouts(userId: string) {
  const { data, error } = await supabase
    .from('workout_routines')
    .select(`
      *,
      workout_exercises (
        *,
        exercise_db (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getWorkout(workoutId: string) {
  const { data, error } = await supabase
    .from('workout_routines')
    .select(`
      *,
      workout_exercises (
        *,
        exercise_db (*)
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error) throw error;
  return data;
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: number,
  position: number,
  sets: number = 3,
  reps?: number,
  restSeconds: number = 90
) {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      routine_id: workoutId,
      exercise_id: exerciseId,
      order_index: position,
      sets,
      reps,
      rest_seconds: restSeconds,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeExerciseFromWorkout(workoutExerciseId: number) {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', workoutExerciseId);

  if (error) throw error;
}

// ============ WORKOUT LOGS ============

export async function startWorkout(userId: string, workoutId?: string) {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: userId,
      routine_id: workoutId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endWorkout(logId: number) {
  const { data, error } = await supabase
    .from('workout_logs')
    .update({
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId)
    .select()
    .single();

  if (error) throw error;

  // Update daily snapshot
  const { data: log } = await supabase
    .from('workout_logs')
    .select('user_id, created_at')
    .eq('id', logId)
    .single();

  if (log) {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    await supabase.rpc('update_daily_snapshot', {
      p_user_id: log.user_id,
      p_date: date,
    });
  }

  return data;
}

export async function logSet(
  logId: number,
  exerciseId: number,
  setNumber: number,
  weight?: number,
  reps?: number,
  rpe?: number,
  restSeconds?: number,
  notes?: string
) {
  const { data, error } = await supabase
    .from('workout_log_sets')
    .insert({
      workout_log_id: logId,
      exercise_id: exerciseId,
      set_number: setNumber,
      weight: weight || null,
      reps: reps || null,
      rpe: rpe || null,
      rest_seconds: restSeconds || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWorkoutLog(logId: number) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      *,
      workout_log_sets (
        *,
        exercise_db (*)
      )
    `)
    .eq('id', logId)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserWorkoutLogs(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      *,
      workout_routines (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============ STEPS ============

export async function logSteps(userId: string, date: string, steps: number) {
  const { data, error } = await supabase
    .from('steps_logs')
    .upsert({
      user_id: userId,
      date,
      steps,
    }, {
      onConflict: 'user_id,date',
    })
    .select()
    .single();

  if (error) throw error;

  // Update daily snapshot
  await supabase.rpc('update_daily_snapshot', {
    p_user_id: userId,
    p_date: date,
  });

  return data;
}

export async function getSteps(userId: string, date: string) {
  const { data, error } = await supabase
    .from('steps_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data || { steps: 0 };
}

export async function getStepsHistory(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('steps_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

