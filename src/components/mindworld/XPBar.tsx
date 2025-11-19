// src/components/mindworld/XPBar.tsx
// XP progress bar component

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

interface XPBarProps {
  userId: string;
}

export default function XPBar({ userId }: XPBarProps) {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
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

  const xpForNextLevel = (level * level) * 100;
  const xpProgress = xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0;

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>Level {level}</Text>
      </View>
      
      <View style={styles.xpContainer}>
        <View style={styles.xpBarBackground}>
          <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {xp} / {xpForNextLevel} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  xpContainer: {
    position: 'relative',
  },
  xpBarBackground: {
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  xpText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

