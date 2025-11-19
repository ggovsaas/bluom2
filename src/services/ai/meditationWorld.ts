// src/services/ai/meditationWorld.ts
// Meditation World Progression System

import { supabase } from '../../lib/supabaseClient';

export interface MeditationCompletion {
  stars: number;
  xp: number;
  level_unlocked: boolean;
}

export async function completeMeditationLevel(
  userId: string,
  levelId: string,
  durationSeconds: number
): Promise<MeditationCompletion> {
  // Get level details (from Module AC)
  // Try meditation_levels first (Module AC), fallback to other tables
  let level: any;
  let levelError: any;
  
  const { data: acLevel } = await supabase
    .from('meditation_levels')
    .select('*')
    .eq('id', levelId)
    .maybeSingle();
  
  if (acLevel) {
    level = acLevel;
  } else {
    // Try alternative table names
    const { data: altLevel } = await supabase
      .from('level_completions')
      .select('level_id, world_id')
      .eq('level_id', levelId)
      .maybeSingle();
    
    if (!altLevel) {
      throw new Error('Level not found');
    }
    
    // Get level from world
    const { data: worldLevel } = await supabase
      .from('meditation_worlds')
      .select('*')
      .eq('id', altLevel.world_id)
      .maybeSingle();
    
    if (!worldLevel) {
      throw new Error('Level not found');
    }
    
    level = { id: levelId, world_id: altLevel.world_id, duration_minutes: 5, xp_reward: 20 };
  }

  if (!level) {
    throw new Error('Level not found');
  }

  // Calculate stars based on duration
  let stars = 1;
  const targetDuration = (level.duration_minutes || 5) * 60;
  
  if (durationSeconds >= targetDuration * 0.6) stars = 2;
  if (durationSeconds >= targetDuration * 0.9) stars = 3;

  // Calculate XP (stars * base XP)
  const baseXP = level.xp_reward || 20;
  const xp = stars * baseXP;

  // Check if already completed (try Module AC table first)
  let existing: any = null;
  
  const { data: acCompletion } = await supabase
    .from('level_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('level_id', levelId)
    .maybeSingle();
  
  existing = acCompletion;

  // Update or insert completion
  if (existing) {
    // Update if better stars
    if (stars > (existing.stars || 1)) {
      const updateData: any = {
        xp_earned: xp,
        duration_seconds: durationSeconds,
      };
      
      // Only update stars if column exists
      if (existing.stars !== undefined) {
        updateData.stars = stars;
      }
      
      await supabase
        .from('level_completions')
        .update(updateData)
        .eq('id', existing.id);
    }
  } else {
    // Insert new completion
    const insertData: any = {
      user_id: userId,
      level_id: levelId,
      xp_earned: xp,
      duration_seconds: durationSeconds,
    };
    
    if (level.world_id) {
      insertData.world_id = level.world_id;
    }
    
    if (stars) {
      insertData.stars = stars;
    }
    
    await supabase.from('level_completions').insert(insertData);
  }

  // Save reward
  await supabase.from('meditation_world_rewards').insert({
    user_id: userId,
    level_id: levelId,
    reward_type: 'xp',
    value: xp,
  });

  // Award XP to Module J's mind_garden_state (if exists)
  try {
    await supabase.rpc('add_xp', {
      p_user_id: userId,
      p_xp: xp,
      p_source: 'meditation',
      p_source_id: levelId,
      p_description: `Completed ${level.name} - ${stars} stars`,
    });
  } catch (error) {
    // Module J might not be applied, ignore
    console.log('Could not award XP to mind garden:', error);
  }

  // Check if next level should be unlocked
  let nextLevel: any = null;
  
  if (level.world_id) {
    const { data: acNextLevel } = await supabase
      .from('meditation_levels')
      .select('*')
      .eq('world_id', level.world_id)
      .eq('level_number', (level.level_number || 0) + 1)
      .maybeSingle();
    
    nextLevel = acNextLevel;
  }

  let level_unlocked = false;
  if (nextLevel) {
    // Check if previous level is completed
    const { data: prevCompleted } = await supabase
      .from('level_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .maybeSingle();

    if (prevCompleted) {
      level_unlocked = true;
      // Next level is automatically unlocked when previous is completed
      // (handled by get_world_levels RPC in Module AC)
    }
  }

  return {
    stars,
    xp,
    level_unlocked,
  };
}

// Get meditation world progress
export async function getMeditationWorldProgress(userId: string) {
  // Try Module AC table first
  let progress: any = null;
  
  const { data: acProgress } = await supabase
    .from('meditation_user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  progress = acProgress || {};

  // Get completed levels
  const { data: completions } = await supabase
    .from('level_completions')
    .select('level_id, stars, xp_earned')
    .eq('user_id', userId);

  // Get total rewards
  const { data: rewards } = await supabase
    .from('meditation_world_rewards')
    .select('value')
    .eq('user_id', userId);

  const totalXP = rewards?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
  const totalStars = completions?.reduce((sum, c) => sum + (c.stars || 1), 0) || 0;

  return {
    ...progress,
    total_xp: totalXP,
    total_stars: totalStars,
    levels_completed: completions?.length || 0,
  };
}

