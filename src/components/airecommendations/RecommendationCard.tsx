// src/components/airecommendations/RecommendationCard.tsx
// Recommendation Card Component - Individual AI recommendation card
// React Native + Web compatible

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

interface RecommendationCardProps {
  recommendation: {
    id: string;
    category: string;
    title: string;
    description: string;
    action?: any;
    priority?: number;
    score?: number;
  };
  onPress?: () => void;
  onDismiss?: () => void;
  onComplete?: () => void;
}

export default function RecommendationCard({ 
  recommendation, 
  onPress, 
  onDismiss, 
  onComplete 
}: RecommendationCardProps) {
  const categoryIcons = {
    nutrition: '🍽️',
    workout: '🏋️',
    sleep: '😴',
    recovery: '💤',
    hydration: '💧',
    wellness: '🧘',
    habit: '✅',
    mood: '😊',
    grocery: '🛒',
    challenge: '🎯'
  };

  const categoryColors = {
    nutrition: '#FF7043',
    workout: '#4CAF50',
    sleep: '#2196F3',
    recovery: '#9C27B0',
    hydration: '#00BCD4',
    wellness: '#FF9800',
    habit: '#795548',
    mood: '#E91E63',
    grocery: '#FFC107',
    challenge: '#F44336'
  };

  const icon = categoryIcons[recommendation.category] || '💡';
  const color = categoryColors[recommendation.category] || '#666';

  const handlePress = async () => {
    if (onPress) {
      onPress();
    }

    // Log click
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetch('/api/airecommendations/interact', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recommendation_id: recommendation.id,
          clicked: true
        })
      });
    }
  };

  const handleDismiss = async () => {
    if (onDismiss) {
      onDismiss();
    }

    // Log dismiss
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetch('/api/airecommendations/interact', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recommendation_id: recommendation.id,
          dismissed: true
        })
      });
    }
  };

  const handleComplete = async () => {
    if (onComplete) {
      onComplete();
    }

    // Log complete
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetch('/api/airecommendations/interact', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recommendation_id: recommendation.id,
          completed: true
        })
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.categoryRow}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.category, { color }]}>
            {recommendation.category.toUpperCase()}
          </Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{recommendation.title}</Text>
      <Text style={styles.description}>{recommendation.description}</Text>

      {onComplete && (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: color }]}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 18,
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  completeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

