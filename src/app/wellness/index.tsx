// src/app/wellness/index.tsx
// Wellness dashboard with AI recommendations

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getWellnessRecommendations, getActiveRecommendations } from '../../services/ai/wellnessRecommendations';
import { getLatestStressScore } from '../../services/ai/stressEngine';
import { getMeditationWorldProgress } from '../../services/ai/meditationWorld';

export default function WellnessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stress, setStress] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [meditationProgress, setMeditationProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stressData, recsData, progressData] = await Promise.all([
        getLatestStressScore(user!.id),
        getActiveRecommendations(user!.id),
        getMeditationWorldProgress(user!.id),
      ]);

      setStress(stressData);
      setRecommendations(recsData);
      setMeditationProgress(progressData);
    } catch (error) {
      console.error('Error loading wellness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStressColor = (level: string) => {
    switch (level) {
      case 'high': return '#ff4444';
      case 'moderate': return '#ffaa00';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStressLabel = (level: string) => {
    switch (level) {
      case 'high': return 'High Stress';
      case 'moderate': return 'Moderate Stress';
      case 'low': return 'Low Stress';
      default: return 'Unknown';
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wellness</Text>
      </View>

      {/* Stress Score */}
      {stress && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stress Level</Text>
          <View style={styles.stressContainer}>
            <View style={[styles.stressBadge, { backgroundColor: getStressColor(stress.level) }]}>
              <Text style={styles.stressScore}>{stress.score}</Text>
              <Text style={styles.stressLabel}>{getStressLabel(stress.level)}</Text>
            </View>
            <View style={styles.stressFactors}>
              {stress.factors && (
                <>
                  {stress.factors.mood_impact !== 0 && (
                    <Text style={styles.factorText}>
                      Mood: {stress.factors.mood_impact > 0 ? '+' : ''}{stress.factors.mood_impact}
                    </Text>
                  )}
                  {stress.factors.sleep_impact !== 0 && (
                    <Text style={styles.factorText}>
                      Sleep: {stress.factors.sleep_impact > 0 ? '+' : ''}{stress.factors.sleep_impact}
                    </Text>
                  )}
                  {stress.factors.meditation_impact !== 0 && (
                    <Text style={styles.factorText}>
                      Meditation: {stress.factors.meditation_impact}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Recommendations</Text>
          <Text style={styles.cardSubtitle}>Do this next...</Text>
          {recommendations.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              style={[
                styles.recommendationItem,
                rec.priority === 'high' && styles.recommendationItemHigh,
              ]}
              onPress={() => {
                // Handle recommendation action
                if (rec.action_type === 'meditation') {
                  router.push('/wellness/meditation');
                } else if (rec.action_type === 'game') {
                  router.push('/wellness/games');
                } else if (rec.action_type === 'mood_log') {
                  router.push('/wellness/mood');
                } else if (rec.action_type === 'habits') {
                  router.push('/wellness/habits');
                }
              }}
            >
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationText}>{rec.text}</Text>
                <Text style={styles.recommendationCategory}>
                  {rec.category.charAt(0).toUpperCase() + rec.category.slice(1)}
                </Text>
              </View>
              {rec.priority === 'high' && (
                <Text style={styles.priorityBadge}>High Priority</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Meditation Progress */}
      {meditationProgress && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meditation World</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>{meditationProgress.total_xp || 0}</Text>
              <Text style={styles.progressLabel}>Total XP</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>{meditationProgress.levels_completed || 0}</Text>
              <Text style={styles.progressLabel}>Levels</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>{meditationProgress.total_stars || 0}</Text>
              <Text style={styles.progressLabel}>Stars</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.meditationButton}
            onPress={() => router.push('/mindverse')}
          >
            <Text style={styles.meditationButtonText}>Enter Meditation World</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/wellness/sleep')}
        >
          <Text style={styles.quickActionEmoji}>😴</Text>
          <Text style={styles.quickActionText}>Sleep</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/wellness/mood')}
        >
          <Text style={styles.quickActionEmoji}>😊</Text>
          <Text style={styles.quickActionText}>Mood</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/wellness/habits')}
        >
          <Text style={styles.quickActionEmoji}>✅</Text>
          <Text style={styles.quickActionText}>Habits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/wellness/meditation')}
        >
          <Text style={styles.quickActionEmoji}>🧘</Text>
          <Text style={styles.quickActionText}>Meditate</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
  },
  stressContainer: {
    alignItems: 'center',
  },
  stressBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stressScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  stressLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  stressFactors: {
    alignItems: 'center',
    gap: 4,
  },
  factorText: {
    color: '#aaa',
    fontSize: 12,
  },
  recommendationItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  recommendationItemHigh: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  recommendationCategory: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  meditationButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  meditationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

