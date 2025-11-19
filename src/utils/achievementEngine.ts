// src/utils/achievementEngine.ts
// Achievement Engine - Automatic badge unlocks
// React Native + Web compatible

import { supabase } from '../lib/supabase';

/**
 * Check and unlock game-related achievements
 */
export async function checkGameAchievements(
  userId: string,
  streak: number,
  totalGamesPlayed?: number,
  bestScore?: number
) {
  const achievements: Array<{ condition: () => boolean; badge: string }> = [];

  // Streak-based achievements
  if (streak === 7) {
    achievements.push({
      condition: () => true,
      badge: '7-Day Mind Game Streak'
    });
  }

  if (streak === 14) {
    achievements.push({
      condition: () => true,
      badge: '2-Week Focus Master'
    });
  }

  if (streak === 30) {
    achievements.push({
      condition: () => true,
      badge: 'Master of Focus'
    });
  }

  if (streak === 90) {
    achievements.push({
      condition: () => true,
      badge: 'Mind Game Legend'
    });
  }

  // Total games achievements
  if (totalGamesPlayed && totalGamesPlayed >= 50) {
    achievements.push({
      condition: () => true,
      badge: 'Game Enthusiast'
    });
  }

  if (totalGamesPlayed && totalGamesPlayed >= 100) {
    achievements.push({
      condition: () => true,
      badge: 'Game Master'
    });
  }

  // Score-based achievements
  if (bestScore && bestScore >= 1000) {
    achievements.push({
      condition: () => true,
      badge: 'High Scorer'
    });
  }

  // Unlock badges (using Module P's badge system)
  for (const achievement of achievements) {
    if (achievement.condition()) {
      try {
        // Find badge by name
        const { data: badge, error: badgeError } = await supabase
          .from('badges')
          .select('id')
          .eq('name', achievement.badge)
          .single();

        if (badge && !badgeError) {
          // Award badge to user
          await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: badge.id
            })
            .select()
            .single();
        }
      } catch (error) {
        // Badge might already exist or not found - that's okay
        console.log(`Badge "${achievement.badge}" not found or already earned`);
      }
    }
  }

  return achievements.filter(a => a.condition()).map(a => a.badge);
}

/**
 * Check and unlock meditation-related achievements
 */
export async function checkMeditationAchievements(
  userId: string,
  streak: number,
  totalMinutes?: number,
  totalSessions?: number
) {
  const achievements: Array<{ condition: () => boolean; badge: string }> = [];

  // Streak-based achievements
  if (streak === 7) {
    achievements.push({
      condition: () => true,
      badge: 'Zen Beginner'
    });
  }

  if (streak === 14) {
    achievements.push({
      condition: () => true,
      badge: 'Mindful Practitioner'
    });
  }

  if (streak === 30) {
    achievements.push({
      condition: () => true,
      badge: 'Zen Master'
    });
  }

  if (streak === 90) {
    achievements.push({
      condition: () => true,
      badge: 'Enlightenment Seeker'
    });
  }

  // Total time achievements
  if (totalMinutes && totalMinutes >= 1000) {
    achievements.push({
      condition: () => true,
      badge: '1000 Minutes of Peace'
    });
  }

  if (totalMinutes && totalMinutes >= 5000) {
    achievements.push({
      condition: () => true,
      badge: 'Meditation Master'
    });
  }

  // Session count achievements
  if (totalSessions && totalSessions >= 100) {
    achievements.push({
      condition: () => true,
      badge: 'Century of Sessions'
    });
  }

  // Unlock badges
  for (const achievement of achievements) {
    if (achievement.condition()) {
      try {
        const { data: badge, error: badgeError } = await supabase
          .from('badges')
          .select('id')
          .eq('name', achievement.badge)
          .single();

        if (badge && !badgeError) {
          await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: badge.id
            })
            .select()
            .single();
        }
      } catch (error) {
        console.log(`Badge "${achievement.badge}" not found or already earned`);
      }
    }
  }

  return achievements.filter(a => a.condition()).map(a => a.badge);
}

/**
 * Check and unlock general wellness achievements
 */
export async function checkWellnessAchievements(
  userId: string,
  wellnessStreak: number,
  moodStreak: number,
  sleepStreak: number
) {
  const achievements: Array<{ condition: () => boolean; badge: string }> = [];

  // Combined wellness streak
  if (wellnessStreak >= 30) {
    achievements.push({
      condition: () => true,
      badge: 'Wellness Warrior'
    });
  }

  // Mood tracking
  if (moodStreak >= 30) {
    achievements.push({
      condition: () => true,
      badge: 'Mood Tracker'
    });
  }

  // Sleep tracking
  if (sleepStreak >= 30) {
    achievements.push({
      condition: () => true,
      badge: 'Sleep Champion'
    });
  }

  // Unlock badges
  for (const achievement of achievements) {
    if (achievement.condition()) {
      try {
        const { data: badge, error: badgeError } = await supabase
          .from('badges')
          .select('id')
          .eq('name', achievement.badge)
          .single();

        if (badge && !badgeError) {
          await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: badge.id
            })
            .select()
            .single();
        }
      } catch (error) {
        console.log(`Badge "${achievement.badge}" not found or already earned`);
      }
    }
  }

  return achievements.filter(a => a.condition()).map(a => a.badge);
}

