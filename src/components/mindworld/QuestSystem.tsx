// src/components/mindworld/QuestSystem.tsx
// Complete Quest System UI - Daily & Weekly quests
// React Native + Web compatible

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import DailyQuestCard from './DailyQuestCard';
import WeeklyQuestCard from './WeeklyQuestCard';
import { supabase } from '../../lib/supabase';

interface QuestSystemProps {
  userId: string;
}

export default function QuestSystem({ userId }: QuestSystemProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [questStats, setQuestStats] = useState({
    dailyCompleted: 0,
    dailyTotal: 0,
    weeklyCompleted: 0,
    weeklyTotal: 0,
  });

  useEffect(() => {
    loadQuestStats();
  }, [userId]);

  const loadQuestStats = async () => {
    try {
      // Get daily quests
      const { data: dailyData } = await supabase.rpc('get_daily_quests', {
        p_user_id: userId
      });

      // Get weekly quests
      const { data: weeklyData } = await supabase.rpc('get_weekly_quests', {
        p_user_id: userId
      });

      if (dailyData?.quests) {
        const completed = dailyData.quests.filter((q: any) => q.completed).length;
        setQuestStats(prev => ({
          ...prev,
          dailyCompleted: completed,
          dailyTotal: dailyData.quests.length,
        }));
      }

      if (weeklyData?.quests) {
        const completed = weeklyData.quests.filter((q: any) => q.completed).length;
        setQuestStats(prev => ({
          ...prev,
          weeklyCompleted: completed,
          weeklyTotal: weeklyData.quests.length,
        }));
      }
    } catch (error) {
      console.error('Error loading quest stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuestStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {questStats.dailyCompleted}/{questStats.dailyTotal}
          </Text>
          <Text style={styles.statLabel}>Daily Quests</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {questStats.weeklyCompleted}/{questStats.weeklyTotal}
          </Text>
          <Text style={styles.statLabel}>Weekly Quests</Text>
        </View>
      </View>

      {/* Daily Quests */}
      <DailyQuestCard userId={userId} />

      {/* Weekly Quests */}
      <WeeklyQuestCard userId={userId} />

      {/* Quest Tips */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>💡 Quest Tips</Text>
        <Text style={styles.tipsText}>
          • Complete quests automatically by doing activities{'\n'}
          • Some quests require manual completion{'\n'}
          • Weekly quests reset every Monday{'\n'}
          • Daily quests reset at midnight{'\n'}
          • Complete all daily quests for bonus rewards
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statsHeader: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tipsBox: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

