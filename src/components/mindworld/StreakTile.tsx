// src/components/mindworld/StreakTile.tsx
// Streak Tile Component - Individual streak display
// React Native + Web compatible

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

interface StreakTileProps {
  userId: string;
  category: 'mood' | 'sleep' | 'meditation' | 'game' | 'water' | 'meal' | 'wellness' | 'activity';
  label: string;
  onPress?: () => void;
}

export default function StreakTile({ userId, category, label, onPress }: StreakTileProps) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('streak-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mind_garden_streaks',
          filter: `user_id=eq.${userId} AND category=eq.${category}`,
        },
        () => {
          loadStreak();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, category]);

  const loadStreak = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_streaks', {
        p_user_id: userId
      });

      if (error) throw error;
      if (data && data[category]) {
        setStreak(data[category].streak || 0);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmoji = () => {
    const emojis: Record<string, string> = {
      mood: '😊',
      sleep: '😴',
      meditation: '🧘',
      game: '🎮',
      water: '💧',
      meal: '🍽️',
      wellness: '🌱',
      activity: '🏃',
    };
    return emojis[category] || '🔥';
  };

  if (loading) {
    return (
      <View style={styles.box}>
        <Text style={styles.loadingText}>...</Text>
      </View>
    );
  }

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.box, streak >= 7 && styles.boxActive]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.emoji}>{getEmoji()}</Text>
      <Text style={styles.streak}>{streak}🔥</Text>
      <Text style={styles.label}>{label}</Text>
      {streak >= 7 && (
        <Text style={styles.badge}>🔥</Text>
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 10,
    width: 90,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  boxActive: {
    borderColor: '#FF7043',
    backgroundColor: '#2a2a2a',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  streak: {
    color: '#FF7043',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  label: {
    color: '#aaa',
    fontSize: 11,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 12,
  },
});

