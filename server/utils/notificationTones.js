// server/utils/notificationTones.js
// Notification Tone Variants (A/B/C)
// Motivational, Friendly, Minimal

export const notificationTones = {
  fuel: {
    breakfast_reminder: {
      motivational: 'Kickstart your day 💪 — fuel up with a good breakfast.',
      friendly: 'Hey! Don\'t forget breakfast 😊 your body will thank you.',
      minimal: 'Time to eat.'
    },
    water_1: {
      motivational: 'Hydration = performance. Drink a glass now!',
      friendly: 'Quick sip break 💧',
      minimal: 'Hydrate.'
    },
    water_2: {
      motivational: 'Stay on track — you\'re below your hydration target.',
      friendly: 'Time for a sip 💧 You\'re behind your water goal today.',
      minimal: 'Drink water.'
    },
    dinner_macro_check: {
      motivational: 'Don\'t forget dinner 🥗 Logging your last meal keeps your plan accurate.',
      friendly: 'Dinner time! Log your meal to stay on track.',
      minimal: 'Log dinner.'
    },
    protein_low: {
      motivational: 'Protein check-in 🍗 You\'re below your goal — a quick snack could help.',
      friendly: 'Need more protein? A quick snack can help!',
      minimal: 'Protein low.'
    },
    calories_low: {
      motivational: 'Don\'t forget dinner 🥗 Logging your last meal keeps your plan accurate.',
      friendly: 'Haven\'t logged much today — want to add dinner?',
      minimal: 'Calories low.'
    }
  },
  move: {
    workout_reminder: {
      motivational: 'You planned a workout — let\'s crush it 🔥',
      friendly: 'Ready for your session? You\'ve got this.',
      minimal: 'Workout time.'
    },
    workout_weekend: {
      motivational: 'Weekend workout? Your body will thank you 💪',
      friendly: 'Perfect time for a workout!',
      minimal: 'Workout time.'
    },
    steps_low: {
      motivational: 'Little low on steps — a 10 min walk boosts your day!',
      friendly: 'Stretch your legs? 😊',
      minimal: 'Steps low.'
    },
    streak_warning: {
      motivational: '🔥 Don\'t lose your {streak}-day workout streak. Even 10 minutes counts.',
      friendly: 'Your {streak}-day streak is at risk! Keep it going 🙌',
      minimal: 'Streak at risk.'
    },
    workout_missed: {
      motivational: 'You missed yesterday\'s session — want a lighter option today?',
      friendly: 'Missed yesterday? No worries — try a lighter workout today.',
      minimal: 'Workout missed.'
    },
    high_readiness: {
      motivational: 'Your body is ready 💪 Great time for your session.',
      friendly: 'Perfect time to train! Your recovery is high.',
      minimal: 'Ready to train.'
    }
  },
  wellness: {
    mood_check: {
      motivational: 'How are you feeling? Check in with yourself ❤️',
      friendly: 'Mood check time 😊',
      minimal: 'Mood check.'
    },
    journal_suggestion: {
      motivational: 'Take 1 minute to clear your mind ✨ Journaling can help you process today.',
      friendly: 'Want to journal? It can help clear your mind.',
      minimal: 'Journal now.'
    },
    meditation: {
      motivational: 'Pause for 3 minutes? Your mind deserves it.',
      friendly: 'Try a quick meditation 😊',
      minimal: 'Meditate.'
    },
    habits_incomplete: {
      motivational: 'You\'re almost done for today! {count} habits left to check off.',
      friendly: 'Almost there! {count} habits to go.',
      minimal: '{count} habits left.'
    }
  },
  sleep: {
    sleep_insight: {
      motivational: 'You slept {hours} hrs. Let\'s make today a balanced one.',
      friendly: 'Morning! Check your sleep insights.',
      minimal: 'Sleep summary ready.'
    },
    sleep_log: {
      motivational: 'How did you sleep? Logging helps track recovery.',
      friendly: 'Log your sleep to track recovery 😊',
      minimal: 'Log sleep.'
    },
    bedtime_prep: {
      motivational: 'Wind down. A better tomorrow starts with tonight 🌙',
      friendly: 'Bedtime reminder 😊',
      minimal: 'Sleep soon.'
    },
    poor_sleep: {
      motivational: 'Rough night? Take it slow today — your plan has been adjusted.',
      friendly: 'Poor sleep detected. Take it easy today.',
      minimal: 'Sleep was poor.'
    }
  },
  games: {
    stress_relief_mini_game: {
      motivational: 'Need a reset? Try a focus mini-game 🎮',
      friendly: 'Quick brain refresh?',
      minimal: 'Try a game.'
    },
    low_mood_game: {
      motivational: 'Try a quick focus reset 🧠 30 seconds can help clear your mind.',
      friendly: 'Feeling low? A quick game might help.',
      minimal: 'Try a game.'
    },
    high_stress_game: {
      motivational: 'Need a break? Try a calming breathing mini-game.',
      friendly: 'Stressed? A quick game can help.',
      minimal: 'Try a game.'
    }
  }
};

/**
 * Get notification message with tone variant
 * @param {string} category - Notification category
 * @param {string} type - Notification type
 * @param {string} tone - Tone variant (motivational, friendly, minimal)
 * @param {object} data - Data for template replacement
 * @returns {string} Formatted message
 */
export function getNotificationMessage(category, type, tone = 'friendly', data = {}) {
  const categoryTones = notificationTones[category];
  if (!categoryTones) {
    return 'Notification';
  }

  const typeTones = categoryTones[type];
  if (!typeTones) {
    return 'Notification';
  }

  let message = typeTones[tone] || typeTones.friendly || 'Notification';

  // Replace template variables
  Object.keys(data).forEach(key => {
    message = message.replace(`{${key}}`, data[key]);
  });

  return message;
}

/**
 * Get notification title with tone variant
 * @param {string} category - Notification category
 * @param {string} type - Notification type
 * @param {string} tone - Tone variant
 * @returns {string} Title
 */
export function getNotificationTitle(category, type, tone = 'friendly') {
  const titles = {
    fuel: {
      breakfast_reminder: {
        motivational: 'Fuel Up 💪',
        friendly: 'Breakfast Time 🥣',
        minimal: 'Breakfast'
      },
      water_1: {
        motivational: 'Hydrate Now',
        friendly: 'Time for a sip 💧',
        minimal: 'Water'
      },
      water_2: {
        motivational: 'Stay Hydrated',
        friendly: 'Time for a sip 💧',
        minimal: 'Water'
      },
      dinner_macro_check: {
        motivational: 'Don\'t Forget Dinner 🥗',
        friendly: 'Dinner Time',
        minimal: 'Dinner'
      }
    },
    move: {
      workout_reminder: {
        motivational: 'Let\'s Crush It 🔥',
        friendly: 'Workout Time 💪',
        minimal: 'Workout'
      },
      steps_low: {
        motivational: 'Take a Walk',
        friendly: 'Steps Low',
        minimal: 'Steps'
      },
      streak_warning: {
        motivational: 'Streak at Risk 🔥',
        friendly: 'Keep Your Streak',
        minimal: 'Streak'
      }
    },
    wellness: {
      mood_check: {
        motivational: 'How Are You? ❤️',
        friendly: 'Mood Check 💬',
        minimal: 'Mood'
      },
      journal_suggestion: {
        motivational: 'Clear Your Mind ✨',
        friendly: 'Journal Time',
        minimal: 'Journal'
      },
      meditation: {
        motivational: 'Pause & Reset',
        friendly: 'Meditation Time 🧘',
        minimal: 'Meditate'
      }
    },
    sleep: {
      sleep_insight: {
        motivational: 'Sleep Insights',
        friendly: 'Morning! Check Your Sleep',
        minimal: 'Sleep'
      },
      bedtime_prep: {
        motivational: 'Wind Down 🌙',
        friendly: 'Bedtime Reminder',
        minimal: 'Sleep'
      }
    },
    games: {
      stress_relief_mini_game: {
        motivational: 'Reset Your Mind 🎮',
        friendly: 'Quick Game?',
        minimal: 'Game'
      }
    }
  };

  const categoryTitles = titles[category];
  if (!categoryTitles) {
    return 'Notification';
  }

  const typeTitles = categoryTitles[type];
  if (!typeTitles) {
    return 'Notification';
  }

  return typeTitles[tone] || typeTitles.friendly || 'Notification';
}

