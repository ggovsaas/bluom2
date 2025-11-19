import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  getTodayNotificationCount,
} from '../utils/notifications';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState({
    enabled: true,
    maxPerDay: 4,
    quietHoursStart: 21,
    quietHoursEnd: 8,
    hydrationReminders: true,
    mealReminders: true,
    stepReminders: true,
    wellnessReminders: true,
  });
  const [todayCount, setTodayCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
    loadTodayCount();
  }, []);

  const loadSettings = async () => {
    const loaded = await loadNotificationSettings();
    setSettings(loaded);
  };

  const checkPermissions = async () => {
    const Notifications = require('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
  };

  const loadTodayCount = async () => {
    const count = await getTodayNotificationCount();
    setTodayCount(count);
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveNotificationSettings(updated);
  };

  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setPermissionGranted(granted);
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted!');
    } else {
      Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        {!permissionGranted && (
          <View style={styles.permissionBanner}>
            <Ionicons name="notifications-off" size={24} color="#dc2626" />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
              <Text style={styles.permissionSubtext}>
                Enable notifications to receive reminders and updates
              </Text>
            </View>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestPermissions}
              activeOpacity={0.7}
            >
              <Text style={styles.permissionButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Count */}
        <View style={styles.countCard}>
          <Ionicons name="notifications" size={24} color="#3b82f6" />
          <View style={styles.countInfo}>
            <Text style={styles.countLabel}>Notifications Today</Text>
            <Text style={styles.countValue}>
              {todayCount} / {settings.maxPerDay}
            </Text>
          </View>
        </View>

        {/* Main Settings */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingSubtext}>Turn notifications on or off</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => handleToggle('enabled', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
              disabled={!permissionGranted}
            />
          </View>
        </View>

        {/* Reminder Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Types</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Hydration Reminders</Text>
              <Text style={styles.settingSubtext}>Water intake reminders</Text>
            </View>
            <Switch
              value={settings.hydrationReminders}
              onValueChange={(value) => handleToggle('hydrationReminders', value)}
              trackColor={{ false: '#e5e7eb', true: '#06b6d4' }}
              thumbColor="#ffffff"
              disabled={!settings.enabled || !permissionGranted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Meal Reminders</Text>
              <Text style={styles.settingSubtext}>Meal logging prompts</Text>
            </View>
            <Switch
              value={settings.mealReminders}
              onValueChange={(value) => handleToggle('mealReminders', value)}
              trackColor={{ false: '#e5e7eb', true: '#f59e0b' }}
              thumbColor="#ffffff"
              disabled={!settings.enabled || !permissionGranted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Step Reminders</Text>
              <Text style={styles.settingSubtext}>Step goal reminders</Text>
            </View>
            <Switch
              value={settings.stepReminders}
              onValueChange={(value) => handleToggle('stepReminders', value)}
              trackColor={{ false: '#e5e7eb', true: '#10b981' }}
              thumbColor="#ffffff"
              disabled={!settings.enabled || !permissionGranted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Wellness Reminders</Text>
              <Text style={styles.settingSubtext}>Mindfulness and relaxation</Text>
            </View>
            <Switch
              value={settings.wellnessReminders}
              onValueChange={(value) => handleToggle('wellnessReminders', value)}
              trackColor={{ false: '#e5e7eb', true: '#14b8a6' }}
              thumbColor="#ffffff"
              disabled={!settings.enabled || !permissionGranted}
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionDescription}>
            No notifications will be sent between {settings.quietHoursStart}:00 and {settings.quietHoursEnd}:00
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#64748b" />
          <Text style={styles.infoText}>
            Notifications are limited to {settings.maxPerDay} per day and are automatically paused during quiet hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  permissionSubtext: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#991b1b',
  },
  permissionButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
  },
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  countInfo: {
    flex: 1,
  },
  countLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#64748b',
    marginBottom: 4,
  },
  countValue: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '600',
    color: '#1e293b',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  sectionDescription: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#64748b',
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748b',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748b',
    lineHeight: 18,
  },
});

