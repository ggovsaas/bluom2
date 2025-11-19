// src/pages/Mindverse.tsx
// Mindverse - World Map Screen
// Shows all meditation worlds with unlock status

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Mindverse() {
  const [worlds, setWorlds] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load worlds
      const worldsResponse = await fetch('/api/meditationworld/worlds', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (worldsResponse.ok) {
        const worldsResult = await worldsResponse.json();
        setWorlds(worldsResult.worlds || []);
      }

      // Load progress
      const progressResponse = await fetch('/api/meditationworld/progress', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (progressResponse.ok) {
        const progressResult = await progressResponse.json();
        setProgress(progressResult.progress);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWorld = async (worldId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/meditationworld/worlds/${worldId}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error unlocking world:', error);
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
        <Text style={styles.title}>Mindverse</Text>
        {progress && (
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              {progress.total_xp} XP • {progress.levels_completed} Levels • {progress.worlds_unlocked} Worlds
            </Text>
          </View>
        )}
      </View>

      <View style={styles.worldsGrid}>
        {worlds.map((world) => (
          <TouchableOpacity
            key={world.id}
            style={[
              styles.worldCard,
              !world.is_unlocked && styles.worldCardLocked
            ]}
            onPress={() => {
              if (world.is_unlocked) {
                // Navigate to world overview
                // navigation.navigate('WorldOverview', { worldId: world.id });
              } else if (world.can_unlock) {
                handleUnlockWorld(world.id);
              }
            }}
          >
            {world.thumbnail_url ? (
              <Image source={{ uri: world.thumbnail_url }} style={styles.worldThumbnail} />
            ) : (
              <View style={styles.worldThumbnailPlaceholder}>
                <Text style={styles.worldEmoji}>
                  {world.name.includes('Forest') ? '🌿' :
                   world.name.includes('Ocean') ? '🌊' :
                   world.name.includes('Volcano') ? '🔥' :
                   world.name.includes('Sky') ? '🌌' :
                   world.name.includes('Ice') ? '❄️' : '🧘'}
                </Text>
              </View>
            )}
            
            <Text style={styles.worldName}>{world.name}</Text>
            <Text style={styles.worldDescription}>{world.description}</Text>
            
            {!world.is_unlocked && (
              <View style={styles.lockOverlay}>
                <Text style={styles.lockText}>🔒</Text>
                {world.can_unlock ? (
                  <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={() => handleUnlockWorld(world.id)}
                  >
                    <Text style={styles.unlockButtonText}>Unlock</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.requirementsText}>
                    {world.unlock_xp} XP • {world.unlock_level} Levels
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
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
    marginBottom: 12,
  },
  progressBar: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
  },
  progressText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  worldsGrid: {
    padding: 16,
    gap: 16,
  },
  worldCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  worldCardLocked: {
    borderColor: '#555',
    opacity: 0.7,
  },
  worldThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  worldThumbnailPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  worldEmoji: {
    fontSize: 80,
  },
  worldName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  worldDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0008',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 48,
    marginBottom: 12,
  },
  unlockButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  unlockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  requirementsText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
  },
});

