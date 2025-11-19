import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import OnboardingScreen from './src/pages/Onboarding';
import HomeScreen from './src/pages/Home';
import FuelScreen from './src/pages/Fuel';
import MoveScreen from './src/pages/Move';
import WellnessScreen from './src/pages/Wellness';
import ProfileScreen from './src/pages/Profile';
import PremiumScreen from './src/pages/Premium';
import RecipesScreen from './src/pages/Recipes';
import WorkoutsScreen from './src/pages/Workouts';
import SoundSettingsScreen from './src/pages/SoundSettings';
import NotificationSettingsScreen from './src/pages/NotificationSettings';
import PlansScreen from './src/pages/Plans';

// Import context
import { UserProvider } from './src/context/UserContext';

// Navigation types
type RootStackParamList = {
  MainTabs: undefined;
  Onboarding: undefined;
  Profile: undefined;
  Premium: undefined;
  Recipes: undefined;
  Workouts: undefined;
  SoundSettings: undefined;
  NotificationSettings: undefined;
  Plans: undefined;
};

type MainTabParamList = {
      Home: undefined;
      Fuel: undefined;
      Move: undefined;
      Wellness: undefined;
      Profile: undefined;
    };

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator
function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 65 + Math.max(insets.bottom - 8, 0),
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size || 24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Fuel" 
        component={FuelScreen}
        options={{
          tabBarLabel: 'Fuel',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size || 24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Move" 
        component={MoveScreen}
        options={{
          tabBarLabel: 'Move',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size || 24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Wellness" 
        component={WellnessScreen}
        options={{
          tabBarLabel: 'Wellness',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size || 24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size || 24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem('aifit_onboarding_completed');
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('aifit_onboarding_completed', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <Text style={styles.loadingText}>Loading AiFit...</Text>
      </SafeAreaView>
    );
  }

  if (showOnboarding) {
    return (
      <UserProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </SafeAreaView>
      </UserProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Premium" component={PremiumScreen} />
                <Stack.Screen name="Recipes" component={RecipesScreen} />
                <Stack.Screen name="Workouts" component={WorkoutsScreen} />
                <Stack.Screen name="SoundSettings" component={SoundSettingsScreen} />
                <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
                <Stack.Screen name="Plans" component={PlansScreen} />
              </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
  },
  loadingText: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default App;