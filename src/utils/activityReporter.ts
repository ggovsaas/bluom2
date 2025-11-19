// src/utils/activityReporter.ts
// Universal Activity Reporter - Bridge between activities and reward engine
// React Native + Web compatible

import { supabase } from '../lib/supabase';

interface ReportActivityParams {
  userId: string;
  activity: string; // "game_reaction", "game_memory", "meditation_5min", etc.
  xp: number;
  tokens?: number;
  streakType: 'meditation' | 'game' | 'mood' | 'sleep' | 'water' | 'meal' | 'wellness' | 'activity';
  sourceId?: string; // Optional: session ID, game ID, etc.
  description?: string;
}

interface ReportActivityResult {
  streakUpdated: boolean;
  streakCount: number;
  xpAwarded: number;
  tokensAwarded: number;
  levelUp?: boolean;
  newLevel?: number;
}

/**
 * Universal Activity Reporter
 * Reports any activity (game, meditation, mood, etc.) to the reward engine
 * Handles streaks, XP, tokens, and triggers reward modals
 */
export async function reportActivity({
  userId,
  activity,
  xp,
  tokens = 0,
  streakType,
  sourceId,
  description
}: ReportActivityParams): Promise<ReportActivityResult> {
  try {
    // 1. Award XP (this also handles level-ups)
    const { data: xpData, error: xpError } = await supabase.rpc('add_xp', {
      p_user_id: userId,
      p_amount: xp,
      p_source: activity,
      p_source_id: sourceId || null,
      p_description: description || null
    });

    if (xpError) {
      console.error('Error adding XP:', xpError);
      throw xpError;
    }

    // 2. Award tokens (if any)
    let tokensAwarded = 0;
    if (tokens > 0) {
      const { data: tokenData, error: tokenError } = await supabase.rpc('add_tokens', {
        p_user_id: userId,
        p_amount: tokens,
        p_source: activity,
        p_source_id: sourceId || null
      });

      if (tokenError) {
        console.error('Error adding tokens:', tokenError);
        // Don't throw - tokens are optional
      } else {
        tokensAwarded = tokens;
      }
    }

    // 3. Update streak (if applicable)
    let streakUpdated = false;
    let streakCount = 0;

    if (streakType) {
      const { data: streakData, error: streakError } = await supabase.rpc('increment_streak', {
        p_user_id: userId,
        p_category: streakType
      });

      if (streakError) {
        console.error('Error incrementing streak:', streakError);
        // Don't throw - streaks are optional
      } else if (streakData) {
        streakUpdated = streakData.status === 'updated' || streakData.status === 'initialized';
        streakCount = streakData.streak || 0;
      }
    }

    // 4. Check quest progress (auto-complete quests)
    if (streakType === 'meditation') {
      await supabase.rpc('check_quest_progress', {
        p_user_id: userId,
        p_quest_type: 'meditate',
        p_progress_value: 1
      });
    } else if (streakType === 'game') {
      await supabase.rpc('check_quest_progress', {
        p_user_id: userId,
        p_quest_type: 'play_game',
        p_progress_value: 1
      });
    }

    return {
      streakUpdated,
      streakCount,
      xpAwarded: xp,
      tokensAwarded,
      levelUp: xpData?.level_up || false,
      newLevel: xpData?.level || undefined
    };
  } catch (error) {
    console.error('Error reporting activity:', error);
    throw error;
  }
}

/**
 * Report meditation session
 * Convenience function for meditation activities
 */
export async function reportMeditation({
  userId,
  durationMinutes,
  meditationId,
  meditationTitle
}: {
  userId: string;
  durationMinutes: number;
  meditationId?: string;
  meditationTitle?: string;
}) {
  // Calculate XP based on duration
  const xpMap: Record<number, number> = {
    2: 20,
    5: 40,
    10: 75,
    20: 150,
    30: 200
  };

  const xp = xpMap[durationMinutes] || Math.floor(durationMinutes * 7.5); // 7.5 XP per minute default
  const tokens = durationMinutes >= 5 ? Math.floor(durationMinutes / 5) : 0;

  // Also log to meditation_sessions_mindworld for tracking
  if (meditationId) {
    await supabase.rpc('log_meditation_session', {
      p_user_id: userId,
      p_meditation_id: meditationId,
      p_meditation_title: meditationTitle || 'Meditation',
      p_duration: durationMinutes * 60
    });
  }

  return await reportActivity({
    userId,
    activity: `meditation_${durationMinutes}min`,
    xp,
    tokens,
    streakType: 'meditation',
    sourceId: meditationId,
    description: `Meditated for ${durationMinutes} minutes`
  });
}

/**
 * Report game session
 * Convenience function for game activities
 */
export async function reportGame({
  userId,
  gameId,
  gameName,
  score,
  durationSeconds,
  performanceBonus = 0
}: {
  userId: string;
  gameId: string;
  gameName: string;
  score: number;
  durationSeconds: number;
  performanceBonus?: number;
}) {
  // Base XP: 10 per game
  // Bonus: +1 XP per 10 points scored (max +50)
  // Bonus: +1 XP per 30 seconds played (max +20)
  let xp = 10;
  xp += Math.min(50, Math.floor(score / 10));
  xp += Math.min(20, Math.floor(durationSeconds / 30));
  xp += performanceBonus; // Additional performance bonus

  // Tokens: 1 token if score > 50, 2 if score > 100
  const tokens = score > 100 ? 2 : score > 50 ? 1 : 0;

  // Also log to games_sessions_mindworld for tracking
  await supabase.rpc('log_game_session', {
    p_user_id: userId,
    p_game_id: gameId,
    p_game_name: gameName,
    p_score: score,
    p_duration: durationSeconds
  });

  return await reportActivity({
    userId,
    activity: `game_${gameName.toLowerCase().replace(/\s+/g, '_')}`,
    xp,
    tokens,
    streakType: 'game',
    sourceId: gameId,
    description: `Played ${gameName} - Score: ${score}`
  });
}

