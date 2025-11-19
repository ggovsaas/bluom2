// src/components/mindworld/DailyQuestCard.tsx
// Daily quests display and completion

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  quest_value: number;
  xp_reward: number;
  token_reward: number;
  completed: boolean;
  completed_at?: string;
}

interface DailyQuestCardProps {
  userId: string;
}

export default function DailyQuestCard({ userId }: DailyQuestCardProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, [userId]);

  const loadQuests = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_quests', {
        p_user_id: userId
      });

      if (error) throw error;
      if (data?.quests) {
        setQuests(data.quests);
      }
    } catch (error) {
      console.error('Error loading daily quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const { data, error } = await supabase.rpc('complete_quest', {
        p_quest_id: questId,
        p_type: 'daily'
      });

      if (error) throw error;
      
      // Reload quests
      await loadQuests();
      
      // Show success message
      alert(`Quest completed! Earned ${data.xp} XP and ${data.tokens} tokens`);
    } catch (error) {
      console.error('Error completing quest:', error);
      alert('Failed to complete quest');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading quests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Daily Quests</Text>
      
      <ScrollView style={styles.questsList}>
        {quests.map((quest) => (
          <View
            key={quest.id}
            style={[
              styles.questCard,
              quest.completed && styles.questCardCompleted
            ]}
          >
            <View style={styles.questHeader}>
              <Text style={styles.questTitle}>{quest.title}</Text>
              {quest.completed && (
                <Text style={styles.completedBadge}>✓</Text>
              )}
            </View>

            <Text style={styles.questDescription}>{quest.description}</Text>

            <View style={styles.questRewards}>
              <Text style={styles.rewardText}>
                ⭐ {quest.xp_reward} XP
              </Text>
              {quest.token_reward > 0 && (
                <Text style={styles.rewardText}>
                  🪙 {quest.token_reward} tokens
                </Text>
              )}
            </View>

            {!quest.completed && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => completeQuest(quest.id)}
              >
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  questsList: {
    maxHeight: 400,
  },
  questCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  questCardCompleted: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    fontSize: 20,
    color: '#4CAF50',
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  questRewards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

