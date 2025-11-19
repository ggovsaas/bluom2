import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditionally import Notifications - Android push removed in Expo Go SDK 53+
let Notifications: any = null;
try {
  if (Platform.OS !== 'android') {
    Notifications = require('expo-notifications');
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.log('Notifications not available in Expo Go');
}

interface NotificationSettings {
  enabled: boolean;
  maxPerDay: number;
  quietHoursStart: number; // 21:00 = 21
  quietHoursEnd: number; // 8:00 = 8
  hydrationReminders: boolean;
  mealReminders: boolean;
  stepReminders: boolean;
  wellnessReminders: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  maxPerDay: 4,
  quietHoursStart: 21,
  quietHoursEnd: 8,
  hydrationReminders: true,
  mealReminders: true,
  stepReminders: true,
  wellnessReminders: true,
};

const NOTIFICATION_COUNT_KEY = 'aifit_notification_count';
const NOTIFICATION_DATE_KEY = 'aifit_notification_date';

// Load notification settings
export const loadNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const settings = await AsyncStorage.getItem('aifit_notification_settings');
    if (settings) {
      return JSON.parse(settings);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Save notification settings
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem('aifit_notification_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

// Request permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Notifications || Platform.OS === 'android') {
    return false; // Not available in Expo Go on Android
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Check if we can send notification (max per day, quiet hours)
const canSendNotification = async (): Promise<boolean> => {
  try {
    const settings = await loadNotificationSettings();
    if (!settings.enabled) return false;

    // Check quiet hours
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= settings.quietHoursStart || currentHour < settings.quietHoursEnd) {
      return false;
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const lastDate = await AsyncStorage.getItem(NOTIFICATION_DATE_KEY);
    const count = lastDate === today
      ? parseInt(await AsyncStorage.getItem(NOTIFICATION_COUNT_KEY) || '0', 10)
      : 0;

    if (count >= settings.maxPerDay) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

// Update notification count
const updateNotificationCount = async (): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = await AsyncStorage.getItem(NOTIFICATION_DATE_KEY);
    const count = lastDate === today
      ? parseInt(await AsyncStorage.getItem(NOTIFICATION_COUNT_KEY) || '0', 10)
      : 0;

    await AsyncStorage.setItem(NOTIFICATION_COUNT_KEY, (count + 1).toString());
    await AsyncStorage.setItem(NOTIFICATION_DATE_KEY, today);
  } catch (error) {
    console.error('Error updating notification count:', error);
  }
};

// Send notification
export const sendNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  if (!Notifications || Platform.OS === 'android') {
    return; // Not available in Expo Go on Android
  }
  
  try {
    const canSend = await canSendNotification();
    if (!canSend) {
      console.log('Notification not sent: limit reached or quiet hours');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });

    await updateNotificationCount();
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Schedule notification
export const scheduleNotification = async (
  title: string,
  body: string,
  trigger: Date | number, // Date or seconds from now
  data?: any
): Promise<string | null> => {
  if (!Notifications || Platform.OS === 'android') {
    return null; // Not available in Expo Go on Android
  }
  
  try {
    const canSend = await canSendNotification();
    if (!canSend) {
      console.log('Notification not scheduled: limit reached or quiet hours');
      return null;
    }

    const triggerDate = typeof trigger === 'number' 
      ? new Date(Date.now() + trigger * 1000)
      : trigger;

    // Check if trigger is in quiet hours
    const settings = await loadNotificationSettings();
    const triggerHour = triggerDate.getHours();
    if (triggerHour >= settings.quietHoursStart || triggerHour < settings.quietHoursEnd) {
      console.log('Notification not scheduled: quiet hours');
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: triggerDate,
    });

    await updateNotificationCount();
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

// Smart notification helpers
export const sendHydrationReminder = async (currentWater: number, goal: number): Promise<void> => {
  const settings = await loadNotificationSettings();
  if (!settings.hydrationReminders) return;

  const percentage = (currentWater / goal) * 100;
  if (percentage >= 45 && percentage <= 55) {
    await sendNotification(
      '💧 Hydration Check',
      `You're halfway to your water goal — keep it flowing!`,
      { type: 'hydration' }
    );
  }
};

export const sendMealReminder = async (mealsLogged: number): Promise<void> => {
  const settings = await loadNotificationSettings();
  if (!settings.mealReminders) return;

  if (mealsLogged < 3) {
    const now = new Date();
    const hour = now.getHours();
    if (hour === 19) { // 7 PM
      await sendNotification(
        '🍽️ Meal Reminder',
        `Still ${3 - mealsLogged} meal${3 - mealsLogged > 1 ? 's' : ''} left unlogged today — quick check-in?`,
        { type: 'meal' }
      );
    }
  }
};

export const sendStepReminder = async (currentSteps: number, goal: number): Promise<void> => {
  const settings = await loadNotificationSettings();
  if (!settings.stepReminders) return;

  const remaining = goal - currentSteps;
  if (remaining > 0 && remaining <= 2000) {
    await sendNotification(
      '🚶‍♂️ Step Goal',
      `${remaining.toLocaleString()} steps left for your daily goal — take a small walk?`,
      { type: 'steps' }
    );
  }
};

export const sendWellnessReminder = async (): Promise<void> => {
  const settings = await loadNotificationSettings();
  if (!settings.wellnessReminders) return;

  await sendNotification(
    '✨ Wellness Reset',
    '5-minute reset: choose a soundscape and breathe.',
    { type: 'wellness' }
  );
};

// Cancel all notifications
export const cancelAllNotifications = async (): Promise<void> => {
  if (!Notifications || Platform.OS === 'android') {
    return; // Not available in Expo Go on Android
  }
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

// Get notification count for today
export const getTodayNotificationCount = async (): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = await AsyncStorage.getItem(NOTIFICATION_DATE_KEY);
    if (lastDate === today) {
      return parseInt(await AsyncStorage.getItem(NOTIFICATION_COUNT_KEY) || '0', 10);
    }
    return 0;
  } catch (error) {
    console.error('Error getting notification count:', error);
    return 0;
  }
};


