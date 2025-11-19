// src/pages/WorldOverview.tsx
// World Overview Screen
// Shows levels, games, and meditation options for a world

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function WorldOverview() {
  const { worldId } = useLocalSearchParams();
  const [world, setWorld] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (worldId) {
      loadWorldData();
    }
  }, [worldId]);

  const loadWorldData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load world details
      const { data: worldData } = await supabase
        .from('meditation_worlds')
        .select('*')
        .eq('id', worldId)
        .single();

      if (worldData) {
        setWorld(worldData);
      }

      // Load levels
      const levelsResponse = await fetch(`/api/meditationworld/worlds/${worldId}/levels`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (levelsResponse.ok) {
        const levelsResult = await levelsResponse.json();
        setLevels(levelsResult.levels || []);
      }
    } catch (error) {
      console.error('Error loading world data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLevel = async (levelId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/meditationworld/sessions/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ level_id: levelId })
      });

      if (response.ok) {
        const result = await response.json();
        // Navigate to meditation player
        // navigation.navigate('MeditationPlayer', { sessionId: result.session_id });
      }
    } catch (error) {
      console.error('Error starting level:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!world) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>World not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.worldName}>{world.name}</Text>
        <Text style={styles.worldDescription}>{world.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Levels</Text>
        {levels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.levelCard,
              level.is_locked && styles.levelCardLocked,
              level.is_completed && styles.levelCardCompleted
            ]}
            onPress={() => {
              if (!level.is_locked) {
                startLevel(level.id);
              }
            }}
            disabled={level.is_locked}
          >
            <View style={styles.levelHeader}>
              <Text style={styles.levelNumber}>Level {level.level_number}</Text>
              {level.is_completed && (
                <Text style={styles.completedBadge}>✓</Text>
              )}
              {level.is_locked && (
                <Text style={styles.lockedBadge}>🔒</Text>
              )}
            </View>
            <Text style={styles.levelName}>{level.name}</Text>
            <Text style={styles.levelDescription}>{level.description}</Text>
            <View style={styles.levelMeta}>
              <Text style={styles.levelMetaText}>
                {level.duration_minutes} min • {level.xp_reward} XP • {level.difficulty}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mind Games</Text>
        <TouchableOpacity
          style={styles.gameButton}
          onPress={() => {
            // Navigate to games hub
            // navigation.navigate('GamesHub');
          }}
        >
          <Text style={styles.gameButtonText}>Play Mind Games</Text>
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
  worldName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  worldDescription: {
    fontSize: 16,
    color: '#aaa',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  levelCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  levelCardLocked: {
    borderColor: '#555',
    opacity: 0.6,
  },
  levelCardCompleted: {
    borderColor: '#FFD700',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  completedBadge: {
    fontSize: 20,
    color: '#FFD700',
  },
  lockedBadge: {
    fontSize: 20,
  },
  levelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  levelMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  levelMetaText: {
    fontSize: 12,
    color: '#666',
  },
  gameButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gameButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});

