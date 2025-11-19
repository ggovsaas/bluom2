// src/components/mindworld/MeditationEnd.tsx
// Meditation completion screen with rewards
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { reportMeditation } from '../../utils/activityReporter';
import { checkMeditationAchievements } from '../../utils/achievementEngine';
import DailyRewardModal from './DailyRewardModal';

interface MeditationEndProps {
  userId: string;
  durationMinutes: number;
  meditationId?: string;
  meditationTitle?: string;
  onClose: () => void;
  onComplete?: () => void;
}

export default function MeditationEnd({
  userId,
  durationMinutes,
  meditationId,
  meditationTitle,
  onClose,
  onComplete
}: MeditationEndProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    finishMeditation();
  }, []);

  const finishMeditation = async () => {
    try {
      setLoading(true);

      // Report meditation activity
      const activityResult = await reportMeditation({
        userId,
        durationMinutes,
        meditationId,
        meditationTitle
      });

      setResult(activityResult);

      // Check for achievements
      const unlockedBadges = await checkMeditationAchievements(
        userId,
        activityResult.streakCount
      );

      if (unlockedBadges.length > 0) {
        setAchievements(unlockedBadges);
      }

      // Show reward modal if streak was updated
      if (activityResult.streakUpdated) {
        setShowRewardModal(true);
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error finishing meditation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Recording your session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧘 Meditation Complete!</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⏱️</Text>
          <Text style={styles.statValue}>{durationMinutes} min</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statValue}>+{result?.xpAwarded || 0}</Text>
          <Text style={styles.statLabel}>XP Earned</Text>
        </View>

        {result?.tokensAwarded > 0 && (
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🪙</Text>
            <Text style={styles.statValue}>+{result.tokensAwarded}</Text>
            <Text style={styles.statLabel}>Tokens</Text>
          </View>
        )}
      </View>

      {result?.streakCount > 0 && (
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>
            {result.streakCount} Day Meditation Streak!
          </Text>
        </View>
      )}

      {achievements.length > 0 && (
        <View style={styles.achievementCard}>
          <Text style={styles.achievementTitle}>🏆 New Achievement!</Text>
          {achievements.map((badge, index) => (
            <Text key={index} style={styles.achievementBadge}>
              {badge}
            </Text>
          ))}
        </View>
      )}

      {result?.levelUp && (
        <View style={styles.levelUpCard}>
          <Text style={styles.levelUpText}>
            🎉 Level Up! You're now Level {result.newLevel}!
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>Done</Text>
      </TouchableOpacity>

      {/* Reward Modal */}
      <DailyRewardModal
        visible={showRewardModal}
        rewardXP={result?.xpAwarded || 0}
        streak={result?.streakCount || 0}
        tokens={result?.tokensAwarded || 0}
        onClose={() => setShowRewardModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#333',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  streakCard: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF7043',
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF7043',
  },
  achievementCard: {
    backgroundColor: '#fff9c4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  achievementBadge: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  levelUpCard: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

