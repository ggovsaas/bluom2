// src/components/streaks/StreakRing.tsx
// Streak Ring Component - Circular progress ring for dashboard
// React Native + Web compatible

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../lib/supabase';

interface StreakRingProps {
  userId: string;
  streakType: string;
  size?: number;
  showLabel?: boolean;
}

export default function StreakRing({ userId, streakType, size = 80, showLabel = true }: StreakRingProps) {
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
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

  if (loading || !streak) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.loadingText}>...</Text>
      </View>
    );
  }

  const radius = size * 0.35;
  const strokeWidth = size * 0.1;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate progress (7 days = full circle)
  const progress = Math.min(streak.current_streak / 7, 1);
  const offset = circumference - progress * circumference;

  const streakTypeInfo = streak.streak_types || {};

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          stroke="#e0e0e0"
          fill="none"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <Circle
          stroke={streak.current_streak >= 7 ? "#FF7043" : "#4CAF50"}
          fill="none"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      
      {/* Label overlay */}
      <View style={styles.label}>
        <Text style={styles.icon}>{streakTypeInfo.icon || '🔥'}</Text>
        <Text style={styles.streakNumber}>{streak.current_streak}</Text>
        {showLabel && (
          <Text style={styles.labelText}>days</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  labelText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  loadingText: {
    color: '#999',
    fontSize: 12,
  },
});

