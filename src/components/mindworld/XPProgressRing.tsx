// src/components/mindworld/XPProgressRing.tsx
// XP Progress Ring Component - React Native + Web compatible
// Uses react-native-svg for cross-platform compatibility

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../lib/supabase';

interface XPProgressRingProps {
  userId: string;
  size?: number;
}

export default function XPProgressRing({ userId, size = 120 }: XPProgressRingProps) {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadXP();
    // Subscribe to real-time updates
    const channel = supabase
      .channel('garden-state-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mind_garden_state',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadXP();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadXP = async () => {
    try {
      const { data, error } = await supabase.rpc('get_garden_state', {
        p_user_id: userId
      });

      if (error) throw error;
      if (data) {
        setLevel(data.level || 1);
        setXp(data.xp || 0);
      }
    } catch (error) {
      console.error('Error loading XP:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.loadingText}>...</Text>
      </View>
    );
  }

  const radius = (size * 0.375); // 45% of size
  const strokeWidth = size * 0.083; // ~10px for 120px size
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // XP formula: level^2 * 100
  const nextLevelXP = (level * level) * 100;
  const progress = nextLevelXP > 0 ? Math.min(xp / nextLevelXP, 1) : 0;
  const offset = circumference - progress * circumference;

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
          stroke="#4CAF50"
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
        <Text style={styles.level}>Lv {level}</Text>
        <Text style={styles.xp}>{xp}/{nextLevelXP}</Text>
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
  level: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  xp: {
    color: '#666',
    fontSize: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
});

