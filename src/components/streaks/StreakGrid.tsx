// src/components/streaks/StreakGrid.tsx
// Streak Grid Component - Shows all streaks in a grid
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import StreakCard from './StreakCard';

interface StreakGridProps {
  userId: string;
  showLabels?: boolean;
}

export default function StreakGrid({ userId, showLabels = true }: StreakGridProps) {
  const [loading, setLoading] = useState(true);
  const [streaks, setStreaks] = useState<any[]>([]);

  useEffect(() => {
    loadStreaks();
  }, [userId]);

  const loadStreaks = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/streaks', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStreaks(result.streaks || []);
      }
    } catch (error) {
      console.error('Error loading streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

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
          <StreakCard
            key={streak.streak_type}
            userId={userId}
            streakType={streak.streak_type}
          />
        ))}
      </ScrollView>

      {streaks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No streaks yet</Text>
          <Text style={styles.emptySubtext}>Start logging activities to build streaks!</Text>
        </View>
      )}
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
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

