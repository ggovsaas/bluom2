// src/components/streaks/StreakCard.tsx
// Streak Card Component - Individual streak display
// React Native + Web compatible

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

interface StreakCardProps {
  userId: string;
  streakType: string;
  onPress?: () => void;
}

export default function StreakCard({ userId, streakType, onPress }: StreakCardProps) {
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('streak-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_streaks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadStreak();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, streakType]);

  const loadStreak = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/streaks/${streakType}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStreak(result.streak);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>...</Text>
      </View>
    );
  }

  if (!streak) {
    return null;
  }

  const Component = onPress ? TouchableOpacity : View;
  const streakTypeInfo = streak.streak_types || {};

  return (
    <Component
      style={[styles.card, streak.current_streak >= 7 && styles.cardActive]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.icon}>{streakTypeInfo.icon || '🔥'}</Text>
      <Text style={styles.streakNumber}>{streak.current_streak}</Text>
      <Text style={styles.streakLabel}>{streakTypeInfo.description || streakType}</Text>
      {streak.longest_streak > streak.current_streak && (
        <Text style={styles.longestText}>Best: {streak.longest_streak} days</Text>
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardActive: {
    borderColor: '#FF7043',
    backgroundColor: '#fff3e0',
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF7043',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  longestText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingText: {
    color: '#999',
    fontSize: 12,
  },
});

