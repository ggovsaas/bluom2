// src/services/ai/notificationAI.ts
// Notification AI Integration - Dynamic notifications based on wellness state

import { supabase } from '../../lib/supabaseClient';
import { computeStressScore, getLatestStressScore } from './stressEngine';
import { analyzeMood, analyzeSleep, analyzeHabits, getMeditationCount } from '../aimind';

export interface DynamicNotification {
  title: string;
  body: string;
  category: 'fuel' | 'move' | 'wellness' | 'games' | 'sleep';
  priority: 'low' | 'medium' | 'high';
  deep_link?: string;
  action_type?: string;
}

export async function getDynamicNotification(userId: string): Promise<DynamicNotification | null> {
  // Check if can send notification (via Module AF RPC)
  try {
    const { data: canSend } = await supabase.rpc('can_send_notification', {
      p_user_id: userId,
      p_category: 'wellness',
    });
    if (!canSend) {
      return null;
    }
  } catch (error) {
    // Module AF might not be applied, continue anyway
    console.log('Could not check notification permission:', error);
  }

  // Get current time
  const now = new Date();
  const hour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  // Get wellness state
  let stress = await getLatestStressScore(userId);
  if (!stress) {
    stress = await computeStressScore(userId);
  }

  const [mood, sleep, habits, meditationCount] = await Promise.all([
    analyzeMood(userId),
    analyzeSleep(userId),
    analyzeHabits(userId),
    getMeditationCount(userId, 1), // Today only
  ]);

  // High stress notifications (anytime during active hours)
  if (stress.level === 'high') {
    if ((isWeekend && hour >= 10 && hour < 22) || (!isWeekend && hour >= 8 && hour < 21)) {
      return {
        title: 'You seem stressed',
        body: 'Try a 3-minute breathing session to reset your mind',
        category: 'wellness',
        priority: 'high',
        deep_link: 'bluom://wellness/meditation?type=breathing&duration=3',
        action_type: 'meditation',
      };
    }
  }

  // Moderate stress (afternoon/evening)
  if (stress.level === 'moderate') {
    if (hour >= 15 && hour < 19) {
      return {
        title: 'Quick reset?',
        body: 'Play a 1-minute focus game for mental clarity',
        category: 'games',
        priority: 'medium',
        deep_link: 'bluom://wellness/games?type=focus',
        action_type: 'game',
      };
    }
  }

  // Low stress - encouragement
  if (stress.level === 'low' && meditationCount === 0) {
    if (hour >= 17 && hour < 20) {
      return {
        title: 'Keep it up!',
        body: 'Your stress is low — try leveling up in Meditation World',
        category: 'wellness',
        priority: 'low',
        deep_link: 'bluom://wellness/meditation',
        action_type: 'meditation',
      };
    }
  }

  // Sleep-based notifications (evening)
  if (sleep.avg < 6 && hour >= 20 && hour < 21) {
    return {
      title: 'Wind down time',
      body: `You've been sleeping ${sleep.avg}h. Try a sleep meditation before bed`,
      category: 'sleep',
      priority: 'high',
      deep_link: 'bluom://wellness/meditation?type=sleep',
      action_type: 'meditation',
    };
  }

  // Mood-based notifications (evening check-in)
  if (mood.avg <= 2 && hour >= 19 && hour < 20) {
    return {
      title: 'How are you feeling?',
      body: 'Log your mood to track your wellness journey',
      category: 'wellness',
      priority: 'medium',
      deep_link: 'bluom://wellness/mood',
      action_type: 'mood_log',
    };
  }

  // Habit reminders (morning/evening)
  if (habits.completion < 60 && habits.total_habits > 0) {
    if (hour >= 8 && hour < 9) {
      return {
        title: 'Start your day right',
        body: `Complete your habits today! ${habits.total_habits - habits.completed_today} remaining`,
        category: 'wellness',
        priority: 'medium',
        deep_link: 'bluom://wellness/habits',
        action_type: 'habits',
      };
    } else if (hour >= 19 && hour < 20) {
      return {
        title: 'Habit check-in',
        body: `Don't forget to complete your habits! ${habits.total_habits - habits.completed_today} remaining`,
        category: 'wellness',
        priority: 'medium',
        deep_link: 'bluom://wellness/habits',
        action_type: 'habits',
      };
    }
  }

  // Meditation streak reminder (if no meditation today)
  if (meditationCount === 0 && hour >= 17 && hour < 19) {
    return {
      title: 'Meditation time',
      body: 'Take 5 minutes to meditate and maintain your streak',
      category: 'wellness',
      priority: 'low',
      deep_link: 'bluom://wellness/meditation',
      action_type: 'meditation',
    };
  }

  // No notification needed
  return null;
}

// Queue notification for sending
export async function queueWellnessNotification(userId: string) {
  const notification = await getDynamicNotification(userId);
  
  if (!notification) {
    return null;
  }

  // Queue via Module AF's notification system
  const { data, error } = await supabase.rpc('queue_notification', {
    p_user_id: userId,
    p_category: notification.category,
    p_type: notification.action_type || 'wellness',
    p_payload: {
      title: notification.title,
      body: notification.body,
      deep_link: notification.deep_link,
      action_type: notification.action_type,
    },
    p_scheduled_at: new Date().toISOString(),
    p_priority: notification.priority === 'high' ? 5 : notification.priority === 'medium' ? 3 : 1,
  });

  if (error) {
    console.error('Error queueing notification:', error);
    return null;
  }

  return data;
}

// Get notification rules for user
export async function getNotificationRules(userId: string) {
  const { data, error } = await supabase
    .from('notification_rules_wellness')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) throw error;
  return data || [];
}

// Create notification rule
export async function createNotificationRule(
  userId: string,
  category: string,
  priority: 'low' | 'medium' | 'high',
  triggerCondition: any
) {
  const { data, error } = await supabase
    .from('notification_rules_wellness')
    .insert({
      user_id: userId,
      category,
      priority,
      trigger_condition: triggerCondition,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

