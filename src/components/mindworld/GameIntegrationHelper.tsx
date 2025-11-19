// src/components/mindworld/GameIntegrationHelper.tsx
// Helper component and utilities for integrating existing games with reward engine
// React Native + Web compatible

import { reportGame } from '../../utils/activityReporter';
import { checkGameAchievements } from '../../utils/achievementEngine';
import { supabase } from '../../lib/supabase';

/**
 * Game Integration Helper
 * Use this in your existing game components to automatically award rewards
 */

/**
 * Example: Reaction Time Game Integration
 * 
 * In your ReactionGame.tsx:
 * 
 * import { finishGameWithRewards } from '@/components/mindworld/GameIntegrationHelper';
 * 
 * async function endGame(avgReaction: number) {
 *   const result = await finishGameWithRewards({
 *     userId: user.id,
 *     gameId: 'reaction-game',
 *     gameName: 'Reaction Time',
 *     score: calculateScore(avgReaction),
 *     durationSeconds: gameDuration,
 *     performanceBonus: avgReaction < 220 ? 50 : avgReaction < 300 ? 30 : 0
 *   });
 * 
 *   // Show result screen
 *   setShowResult(true);
 *   setRewards(result);
 * }
 */
export async function finishGameWithRewards({
  userId,
  gameId,
  gameName,
  score,
  durationSeconds,
  performanceBonus = 0,
  additionalData
}: {
  userId: string;
  gameId: string;
  gameName: string;
  score: number;
  durationSeconds: number;
  performanceBonus?: number;
  additionalData?: Record<string, any>;
}) {
  try {
    // Report game activity (awards XP, tokens, updates streak)
    const activityResult = await reportGame({
      userId,
      gameId,
      gameName,
      score,
      durationSeconds,
      performanceBonus
    });

    // Check for achievements
    const achievements = await checkGameAchievements(
      userId,
      activityResult.streakCount,
      undefined, // totalGamesPlayed - could be fetched
      score
    );

    return {
      ...activityResult,
      achievements,
      shouldShowRewardModal: activityResult.streakUpdated
    };
  } catch (error) {
    console.error('Error finishing game with rewards:', error);
    throw error;
  }
}

/**
 * Example: Memory Game Integration
 * 
 * In your MemoryGame.tsx:
 * 
 * import { finishGameWithRewards } from '@/components/mindworld/GameIntegrationHelper';
 * 
 * async function endMemoryGame(score: number, level: number) {
 *   const performanceBonus = level >= 10 ? 50 : level >= 5 ? 25 : 0;
 *   
 *   const result = await finishGameWithRewards({
 *     userId: user.id,
 *     gameId: 'memory-game',
 *     gameName: 'Memory Match',
 *     score: score,
 *     durationSeconds: gameDuration,
 *     performanceBonus
 *   });
 * 
 *   // Show GameEnd component
 *   navigation.navigate('GameEnd', { result });
 * }
 */
export async function finishMemoryGame({
  userId,
  score,
  level,
  durationSeconds
}: {
  userId: string;
  score: number;
  level: number;
  durationSeconds: number;
}) {
  const performanceBonus = level >= 10 ? 50 : level >= 5 ? 25 : 0;

  return await finishGameWithRewards({
    userId,
    gameId: 'memory-game',
    gameName: 'Memory Match',
    score,
    durationSeconds,
    performanceBonus
  });
}

/**
 * Example: Focus Game Integration
 * 
 * In your FocusGame.tsx:
 * 
 * import { finishGameWithRewards } from '@/components/mindworld/GameIntegrationHelper';
 * 
 * async function endFocusGame(accuracy: number, durationSeconds: number) {
 *   const score = Math.floor(accuracy * 100);
 *   const performanceBonus = accuracy > 0.9 ? 40 : accuracy > 0.8 ? 20 : 0;
 *   
 *   const result = await finishGameWithRewards({
 *     userId: user.id,
 *     gameId: 'focus-game',
 *     gameName: 'Focus Hold',
 *     score,
 *     durationSeconds,
 *     performanceBonus
 *   });
 * }
 */
export async function finishFocusGame({
  userId,
  accuracy,
  durationSeconds
}: {
  userId: string;
  accuracy: number;
  durationSeconds: number;
}) {
  const score = Math.floor(accuracy * 100);
  const performanceBonus = accuracy > 0.9 ? 40 : accuracy > 0.8 ? 20 : 0;

  return await finishGameWithRewards({
    userId,
    gameId: 'focus-game',
    gameName: 'Focus Hold',
    score,
    durationSeconds,
    performanceBonus
  });
}

/**
 * Hook for game integration
 * Use this in your game components
 */
export function useGameRewards(userId: string) {
  const finishGame = async (
    gameId: string,
    gameName: string,
    score: number,
    durationSeconds: number,
    performanceBonus: number = 0
  ) => {
    return await finishGameWithRewards({
      userId,
      gameId,
      gameName,
      score,
      durationSeconds,
      performanceBonus
    });
  };

  return { finishGame };
}

/**
 * Get game statistics for display
 */
export async function getGameStats(userId: string, gameId: string) {
  try {
    const { data, error } = await supabase
      .from('games_sessions_mindworld')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const totalGames = data?.length || 0;
    const totalXP = data?.reduce((sum, session) => sum + (session.xp_earned || 0), 0) || 0;
    const bestScore = data?.reduce((best, session) => Math.max(best, session.score || 0), 0) || 0;
    const avgScore = data?.length > 0
      ? data.reduce((sum, session) => sum + (session.score || 0), 0) / data.length
      : 0;

    return {
      totalGames,
      totalXP,
      bestScore,
      avgScore,
      recentSessions: data || []
    };
  } catch (error) {
    console.error('Error getting game stats:', error);
    return {
      totalGames: 0,
      totalXP: 0,
      bestScore: 0,
      avgScore: 0,
      recentSessions: []
    };
  }
}

