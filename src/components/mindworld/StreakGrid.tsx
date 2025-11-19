// src/components/mindworld/StreakGrid.tsx
// Streak Grid Component - Shows all streaks in a grid
// React Native + Web compatible

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import StreakTile from './StreakTile';

interface StreakGridProps {
  userId: string;
  showLabels?: boolean;
}

export default function StreakGrid({ userId, showLabels = true }: StreakGridProps) {
  const streaks = [
    { category: 'mood' as const, label: 'Mood' },
    { category: 'sleep' as const, label: 'Sleep' },
    { category: 'meditation' as const, label: 'Meditation' },
    { category: 'game' as const, label: 'Games' },
    { category: 'water' as const, label: 'Water' },
    { category: 'meal' as const, label: 'Meals' },
    { category: 'wellness' as const, label: 'Wellness' },
    { category: 'activity' as const, label: 'Activity' },
  ];

  return (
    <View style={styles.container}>
      {showLabels && (
        <Text style={styles.title}>🔥 Your Streaks</Text>
      )}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {streaks.map((streak) => (
          <StreakTile
            key={streak.category}
            userId={userId}
            category={streak.category}
            label={streak.label}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
  },
});

