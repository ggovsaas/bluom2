import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { sendStepReminder, sendWellnessReminder } from '../utils/notifications';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile, dailyData, getTodayTotals, hasActiveTrial, isPremiumOrTrial } = useUser();

  // Get today's nutrition totals from food entries
  const todayTotals = getTodayTotals();

  // Trigger notifications when data changes
  useEffect(() => {
    // Step reminder (check if within 2000 steps of goal)
    const stepGoal = 10000;
    if (dailyData.steps > 0 && dailyData.steps < stepGoal) {
      sendStepReminder(dailyData.steps, stepGoal);
    }
  }, [dailyData.steps]);
  
  // Calculate remaining calories: Goal - Food + Exercise
  const remainingCalories = (profile?.dailyCalories || 2000) - todayTotals.calories + dailyData.caloriesBurned;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayStats = [
    {
      icon: 'locate',
      label: 'Steps',
      value: dailyData.steps.toLocaleString(),
      target: '10,000',
      color: '#2563eb',
      bgColor: '#dbeafe',
    },
    {
      icon: 'barbell',
      label: 'Exercise',
      value: `${dailyData.exerciseMinutes}min`,
      target: '30min',
      color: '#16a34a',
      bgColor: '#dcfce7',
    },
    {
      icon: 'flash',
      label: 'Calories Burned',
      value: dailyData.caloriesBurned.toString(),
      target: '400',
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      icon: 'moon',
      label: 'Sleep',
      value: `${dailyData.sleepHours}h`,
      target: '8h',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
  ];

  const quickActions = [
    { icon: 'restaurant', label: 'Recipes', path: 'Recipes', color: '#f97316', bgColor: '#fff7ed' },
    { icon: 'barbell', label: 'Workouts', path: 'Workouts', color: '#16a34a', bgColor: '#f0fdf4' },
    { icon: 'heart', label: 'Habits', path: 'Wellness', color: '#ec4899', bgColor: '#fdf2f8' },
    { icon: 'moon', label: 'Sleep', path: 'Wellness', color: '#8b5cf6', bgColor: '#f5f3ff' },
    { icon: 'people', label: 'Friends', path: null, color: '#3b82f6', bgColor: '#eff6ff' },
    { icon: 'settings', label: 'Settings', path: 'Profile', color: '#6b7280', bgColor: '#f9fafb' },
  ];

  // Weekly chart data (mock data for now)
  const weekData = [1, 3, 2, 4, 3, 5, 4];
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>
                {getGreeting()}, {profile?.name || 'User'}!
              </Text>
              <Text style={styles.subtitle}>Ready to crush your goals today?</Text>
            </View>
            <TouchableOpacity
              style={styles.premiumButtonSmall}
              onPress={() => navigation.navigate('Premium' as never)}
              activeOpacity={0.7}
            >
              <Ionicons name="diamond" size={20} color="#f97316" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trial Status Banner */}
        {hasActiveTrial() && !profile?.isPremium && (
          <View style={styles.trialBanner}>
            <Ionicons name="sparkles" size={20} color="#f59e0b" />
            <View style={styles.trialBannerText}>
              <Text style={styles.trialBannerTitle}>Free Trial Active</Text>
              <Text style={styles.trialBannerSubtext}>
                {(() => {
                  if (!profile?.trialEndDate) return 'Enjoying Premium features';
                  const endDate = new Date(profile.trialEndDate);
                  const now = new Date();
                  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} left` : 'Trial ending soon';
                })()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Premium' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.trialBannerButton}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Balance Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Balance</Text>
            <Ionicons name="locate" size={24} color="#2563eb" />
          </View>
          
          <View style={styles.balanceGrid}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Goal</Text>
                  <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>{profile?.dailyCalories || 2000}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Food</Text>
                  <Text style={[styles.balanceValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>
                    {Math.round(todayTotals.calories)}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Exercise</Text>
                  <Text style={[styles.balanceValue, { color: '#f97316' }]} numberOfLines={1} adjustsFontSizeToFit>
                    {dailyData.caloriesBurned}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Remaining</Text>
                  <Text style={[
                    styles.balanceValue,
                    { color: remainingCalories > 0 ? '#2563eb' : '#dc2626' }
                  ]} numberOfLines={1} adjustsFontSizeToFit>
                    {Math.round(remainingCalories)}
                  </Text>
                </View>
          </View>
        </View>

        {/* Macros Today Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Macros Today</Text>
          
          <View style={styles.macrosGrid}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroCircle, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.macroValue, { color: '#dc2626' }]} numberOfLines={1} adjustsFontSizeToFit>
                      {Math.round(todayTotals.protein)}g
                    </Text>
                  </View>
                  <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>Protein</Text>
                  <Text style={styles.macroGoal} numberOfLines={1} adjustsFontSizeToFit>
                    {profile?.dailyProtein || 150}g goal
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <View style={[styles.macroCircle, { backgroundColor: '#dbeafe' }]}>
                    <Text style={[styles.macroValue, { color: '#2563eb' }]} numberOfLines={1} adjustsFontSizeToFit>
                      {Math.round(todayTotals.carbs)}g
                    </Text>
                  </View>
                  <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>Carbs</Text>
                  <Text style={styles.macroGoal} numberOfLines={1} adjustsFontSizeToFit>
                    {profile?.dailyCarbs || 225}g goal
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <View style={[styles.macroCircle, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.macroValue, { color: '#d97706' }]} numberOfLines={1} adjustsFontSizeToFit>
                      {Math.round(todayTotals.fat)}g
                    </Text>
                  </View>
                  <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>Fat</Text>
                  <Text style={styles.macroGoal} numberOfLines={1} adjustsFontSizeToFit>
                    {profile?.dailyFat || 67}g goal
                  </Text>
                </View>
          </View>
        </View>

        {/* Today's Stats */}
        <View style={styles.statsContainer}>
          {todayStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{stat.label}</Text>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
                  <Text style={styles.statTarget} numberOfLines={1} adjustsFontSizeToFit>of {stat.target}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Activity Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Week</Text>
            <Ionicons name="trending-up" size={24} color="#16a34a" />
          </View>
          
          <View style={styles.chartContainer}>
            {weekData.map((height, index) => (
              <View key={index} style={styles.chartItem}>
                <View
                  style={[
                    styles.chartBar,
                    { height: height * 20 }
                  ]}
                />
                <Text style={styles.chartDay}>{weekDays[index]}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.chartLabel}>Calories burned this week</Text>
        </View>

        {/* Discover Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discover</Text>
          
          <View style={styles.discoverGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.discoverItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (action.path === null) {
                    // Friends page doesn't exist yet
                    Alert.alert('Coming Soon', 'Friends feature is coming soon!');
                  } else {
                    // Navigate to the page
                    navigation.navigate(action.path as never);
                  }
                }}
              >
                <View style={[styles.discoverIconContainer, { backgroundColor: action.bgColor }]}>
                  <Ionicons name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={styles.discoverLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Premium Promo */}
        {!profile?.isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => navigation.navigate('Premium' as never)}
            activeOpacity={0.8}
          >
            <View style={styles.premiumBannerContent}>
              <View style={styles.premiumBannerTextContainer}>
                <Text style={styles.premiumBannerTitle}>Go Premium</Text>
                    <Text style={styles.premiumBannerText} numberOfLines={3} adjustsFontSizeToFit>
                      Unlock unlimited workouts,{'\n'}personalized plans, and{'\n'}advanced analytics
                    </Text>
              </View>
              <View style={styles.premiumBannerButton}>
                <Ionicons name="chevron-forward" size={24} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebf2fe',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  premiumButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  balanceLabel: {
    fontSize: isSmallScreen ? 10 : 12,
    color: '#64748b',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: isSmallScreen ? 16 : 20,
    fontWeight: 'bold',
    color: '#1e293b',
    minHeight: isSmallScreen ? 20 : 24,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  macroCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    minHeight: 18,
  },
  macroLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#64748b',
    marginBottom: 2,
    minHeight: 16,
  },
  macroGoal: {
    fontSize: isSmallScreen ? 10 : 12,
    color: '#94a3b8',
    minHeight: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 64) / 2,
    backgroundColor: '#ffffff',
    padding: isSmallScreen ? 12 : 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: isSmallScreen ? 10 : 12,
    color: '#64748b',
    marginBottom: 4,
    minHeight: 14,
  },
  statValue: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
    minHeight: isSmallScreen ? 22 : 24,
  },
  statTarget: {
    fontSize: isSmallScreen ? 10 : 12,
    color: '#94a3b8',
    minHeight: 14,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 128,
    marginBottom: 8,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 24,
    backgroundColor: '#2563eb',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 8,
    minHeight: 8,
  },
  chartDay: {
    fontSize: 12,
    color: '#64748b',
  },
  chartLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  discoverItem: {
    width: (width - 96) / 3,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  discoverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  discoverLabel: {
    fontSize: 12,
    color: '#1e293b',
    textAlign: 'center',
  },
  premiumBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#f97316',
    padding: 24,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  premiumBannerTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  premiumBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  premiumBannerText: {
    fontSize: isSmallScreen ? 11 : 13,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: isSmallScreen ? 16 : 18,
    minHeight: isSmallScreen ? 48 : 54,
  },
  premiumBannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  trialBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trialBannerText: {
    flex: 1,
  },
  trialBannerTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 2,
  },
  trialBannerSubtext: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#78350f',
  },
  trialBannerButton: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
});
