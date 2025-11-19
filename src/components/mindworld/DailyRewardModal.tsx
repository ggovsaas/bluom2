// src/components/mindworld/DailyRewardModal.tsx
// Daily Reward Popup Modal - Animated
// React Native + Web compatible

import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface DailyRewardModalProps {
  visible: boolean;
  rewardXP: number;
  streak: number;
  tokens?: number;
  onClose: () => void;
}

export default function DailyRewardModal({
  visible,
  rewardXP,
  streak,
  tokens = 0,
  onClose
}: DailyRewardModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text style={styles.title}>🔥 Daily Streak!</Text>
          
          <View style={styles.streakContainer}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>Days</Text>
          </View>

          <View style={styles.rewardsContainer}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>⭐</Text>
              <Text style={styles.rewardValue}>+{rewardXP} XP</Text>
            </View>
            
            {tokens > 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardEmoji}>🪙</Text>
                <Text style={styles.rewardValue}>+{tokens} Tokens</Text>
              </View>
            )}
          </View>

          <Text style={styles.message}>
            Keep it up! Your consistency is building your Mind Garden 🌱
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 2,
    borderColor: '#FF7043',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  streakNumber: {
    fontSize: 56,
    color: '#FF7043',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 18,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  rewardValue: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

