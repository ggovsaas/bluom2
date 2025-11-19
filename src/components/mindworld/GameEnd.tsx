// src/components/mindworld/GameEnd.tsx
// Game completion screen with rewards
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { reportGame } from '../../utils/activityReporter';
import { checkGameAchievements } from '../../utils/achievementEngine';
import DailyRewardModal from './DailyRewardModal';

interface GameEndProps {
  userId: string;
  gameId: string;
  gameName: string;
  score: number;
  durationSeconds: number;
  performanceBonus?: number; // Additional XP for exceptional performance
  onClose: () => void;
  onPlayAgain?: () => void;
}

export default function GameEnd({
  userId,
  gameId,
  gameName,
  score,
  durationSeconds,
  performanceBonus = 0,
  onClose,
  onPlayAgain
}: GameEndProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    finishGame();
  }, []);

  const finishGame = async () => {
    try {
      setLoading(true);

      // Report game activity
      const activityResult = await reportGame({
        userId,
        gameId,
        gameName,
        score,
        durationSeconds,
        performanceBonus
      });

      setResult(activityResult);

      // Check for achievements
      const unlockedBadges = await checkGameAchievements(
        userId,
        activityResult.streakCount,
        undefined, // totalGamesPlayed - could be fetched separately
        score // bestScore
      );

      if (unlockedBadges.length > 0) {
        setAchievements(unlockedBadges);
      }

      // Show reward modal if streak was updated
      if (activityResult.streakUpdated) {
        setShowRewardModal(true);
      }
    } catch (error) {
      console.error('Error finishing game:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Calculating rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎮 Game Complete!</Text>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Final Score</Text>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>

      <View style={styles.statsContainer}>
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

        {result?.streakCount > 0 && (
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{result.streakCount}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        )}
      </View>

      {result?.levelUp && (
        <View style={styles.levelUpCard}>
          <Text style={styles.levelUpText}>
            🎉 Level Up! You're now Level {result.newLevel}!
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

      <View style={styles.buttonRow}>
        {onPlayAgain && (
          <TouchableOpacity
            style={[styles.button, styles.playAgainButton]}
            onPress={onPlayAgain}
          >
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.closeButton]}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>

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
    marginBottom: 24,
    color: '#333',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    width: '100%',
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
  levelUpCard: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    width: '100%',
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  achievementCard: {
    backgroundColor: '#fff9c4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    width: '100%',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  playAgainButton: {
    backgroundColor: '#2196F3',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

