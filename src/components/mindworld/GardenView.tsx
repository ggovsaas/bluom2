// src/components/mindworld/GardenView.tsx
// Mind Garden visual component - React Native + Web compatible

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { supabase } from '../../lib/supabase';

interface GardenState {
  level: number;
  xp: number;
  tokens: number;
  garden: {
    plants: any[];
    decorations: any[];
    weather: string;
    timeOfDay: string;
  };
  unlocked_items: any[];
}

interface GardenViewProps {
  userId: string;
  onNavigate?: (screen: string) => void;
}

export default function GardenView({ userId, onNavigate }: GardenViewProps) {
  const [gardenState, setGardenState] = useState<GardenState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGardenState();
  }, [userId]);

  const loadGardenState = async () => {
    try {
      const { data, error } = await supabase.rpc('get_garden_state', {
        p_user_id: userId
      });

      if (error) throw error;
      setGardenState(data);
    } catch (error) {
      console.error('Error loading garden state:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading garden...</Text>
      </View>
    );
  }

  if (!gardenState) {
    return (
      <View style={styles.container}>
        <Text>Garden not initialized</Text>
      </View>
    );
  }

  const xpForNextLevel = (gardenState.level * gardenState.level) * 100;
  const xpProgress = (gardenState.xp / xpForNextLevel) * 100;

  return (
    <View style={styles.container}>
      {/* Garden Visual Area */}
      <View style={[styles.gardenArea, getWeatherStyle(gardenState.garden.weather)]}>
        {/* Plants */}
        {gardenState.garden.plants.map((plant, index) => (
          <View key={index} style={styles.plant}>
            <Text style={styles.plantEmoji}>🌱</Text>
          </View>
        ))}
        
        {/* Decorations */}
        {gardenState.garden.decorations.map((decoration, index) => (
          <View key={index} style={styles.decoration}>
            <Text style={styles.decorationEmoji}>✨</Text>
          </View>
        ))}

        {/* Weather Effect */}
        <Text style={styles.weatherEmoji}>
          {getWeatherEmoji(gardenState.garden.weather)}
        </Text>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Level</Text>
          <Text style={styles.statValue}>{gardenState.level}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>XP</Text>
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBar, { width: `${xpProgress}%` }]} />
            <Text style={styles.xpText}>
              {gardenState.xp} / {xpForNextLevel}
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tokens</Text>
          <Text style={styles.statValue}>🪙 {gardenState.tokens}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate?.('meditation')}
        >
          <Text style={styles.actionButtonText}>🧘 Meditate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate?.('games')}
        >
          <Text style={styles.actionButtonText}>🎮 Play Games</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate?.('quests')}
        >
          <Text style={styles.actionButtonText}>📋 Quests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate?.('unlocks')}
        >
          <Text style={styles.actionButtonText}>🎁 Unlocks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getWeatherEmoji(weather: string): string {
  const emojis: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
    snowy: '❄️',
    foggy: '🌫️'
  };
  return emojis[weather] || '☀️';
}

function getWeatherStyle(weather: string) {
  const styles: Record<string, any> = {
    sunny: { backgroundColor: '#FFE5B4' },
    cloudy: { backgroundColor: '#E8E8E8' },
    rainy: { backgroundColor: '#B0C4DE' },
    stormy: { backgroundColor: '#708090' },
    snowy: { backgroundColor: '#F0F8FF' },
    foggy: { backgroundColor: '#D3D3D3' }
  };
  return styles[weather] || styles.sunny;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  gardenArea: {
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  plant: {
    position: 'absolute',
  },
  plantEmoji: {
    fontSize: 32,
  },
  decoration: {
    position: 'absolute',
  },
  decorationEmoji: {
    fontSize: 24,
  },
  weatherEmoji: {
    fontSize: 48,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  xpBarContainer: {
    width: 100,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  xpText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 20,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

