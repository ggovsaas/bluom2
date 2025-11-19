// src/components/mindworld/MeditationHubMindWorld.tsx
// Meditation Hub for Mind Garden - integrates with existing MeditationHub
// React Native + Web compatible

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { supabase } from '../../lib/supabase';

interface Meditation {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  audio_url?: string;
  image_url?: string;
  premium: boolean;
}

interface MeditationHubMindWorldProps {
  userId: string;
  onStartMeditation?: (meditation: Meditation) => void;
}

export default function MeditationHubMindWorld({ userId, onStartMeditation }: MeditationHubMindWorldProps) {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [soundscapes, setSoundscapes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadMeditations();
    loadSoundscapes();
  }, [userId]);

  const loadMeditations = async () => {
    try {
      const { data, error } = await supabase
        .from('meditation_catalog')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeditations(data || []);
    } catch (error) {
      console.error('Error loading meditations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSoundscapes = async () => {
    try {
      const { data, error } = await supabase
        .from('soundscapes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSoundscapes(data || []);
    } catch (error) {
      console.error('Error loading soundscapes:', error);
    }
  };

  const startMeditation = async (meditation: Meditation) => {
    setSelectedMeditation(meditation);
    setShowPlayer(true);
    
    if (onStartMeditation) {
      onStartMeditation(meditation);
    }
  };

  const completeMeditation = async (durationSeconds: number) => {
    if (!selectedMeditation) return;

    try {
      const { data, error } = await supabase.rpc('log_meditation_session', {
        p_user_id: userId,
        p_meditation_id: selectedMeditation.id,
        p_meditation_title: selectedMeditation.title,
        p_duration: durationSeconds
      });

      if (error) throw error;

      // Also increment meditation streak
      await supabase.rpc('log_meditation_action', {
        p_user_id: userId
      });

      // Check quest progress
      await supabase.rpc('check_quest_progress', {
        p_user_id: userId,
        p_quest_type: 'meditate',
        p_progress_value: Math.floor(durationSeconds / 60)
      });

      setShowPlayer(false);
      alert(`Meditation completed! Earned ${data.xp} XP and ${data.tokens} tokens`);
    } catch (error) {
      console.error('Error completing meditation:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading meditations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧘 Meditation Hub</Text>

      {/* Quick Start */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Start</Text>
        <View style={styles.quickStartGrid}>
          <TouchableOpacity
            style={styles.quickStartButton}
            onPress={() => {
              const quick = meditations.find(m => m.duration_minutes === 5);
              if (quick) startMeditation(quick);
            }}
          >
            <Text style={styles.quickStartEmoji}>⚡</Text>
            <Text style={styles.quickStartText}>5 min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStartButton}
            onPress={() => {
              const medium = meditations.find(m => m.duration_minutes === 10);
              if (medium) startMeditation(medium);
            }}
          >
            <Text style={styles.quickStartEmoji}>🧘</Text>
            <Text style={styles.quickStartText}>10 min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStartButton}
            onPress={() => {
              const long = meditations.find(m => m.duration_minutes === 20);
              if (long) startMeditation(long);
            }}
          >
            <Text style={styles.quickStartEmoji}>🌙</Text>
            <Text style={styles.quickStartText}>20 min</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['sleep', 'stress', 'focus', 'anxiety', 'mindfulness'].map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.categoryChip}
            >
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Meditation List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Meditations</Text>
        {meditations.map((meditation) => (
          <TouchableOpacity
            key={meditation.id}
            style={styles.meditationCard}
            onPress={() => startMeditation(meditation)}
          >
            <View style={styles.meditationInfo}>
              <Text style={styles.meditationTitle}>{meditation.title}</Text>
              <Text style={styles.meditationDescription}>{meditation.description}</Text>
              <View style={styles.meditationMeta}>
                <Text style={styles.meditationDuration}>
                  ⏱ {meditation.duration_minutes} min
                </Text>
                <Text style={styles.meditationCategory}>
                  {meditation.category}
                </Text>
                {meditation.premium && (
                  <Text style={styles.premiumBadge}>⭐ Premium</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Soundscapes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔊 Soundscapes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {soundscapes.map((soundscape) => (
            <TouchableOpacity
              key={soundscape.id}
              style={styles.soundscapeCard}
            >
              <Text style={styles.soundscapeEmoji}>🌊</Text>
              <Text style={styles.soundscapeTitle}>{soundscape.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Meditation Player Modal */}
      <Modal
        visible={showPlayer}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.playerContainer}>
            <Text style={styles.playerTitle}>
              {selectedMeditation?.title}
            </Text>
            <Text style={styles.playerDuration}>
              {selectedMeditation?.duration_minutes} minutes
            </Text>
            
            {/* Timer would go here - simplified for now */}
            <View style={styles.playerControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowPlayer(false)}
              >
                <Text style={styles.controlButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.completeButton]}
                onPress={() => {
                  const duration = (selectedMeditation?.duration_minutes || 5) * 60;
                  completeMeditation(duration);
                }}
              >
                <Text style={styles.controlButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickStartGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStartButton: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  quickStartEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickStartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  categoryChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  meditationCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  meditationInfo: {
    flex: 1,
  },
  meditationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meditationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  meditationMeta: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  meditationDuration: {
    fontSize: 12,
    color: '#666',
  },
  meditationCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  premiumBadge: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  soundscapeCard: {
    width: 120,
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  soundscapeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  soundscapeTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    alignItems: 'center',
  },
  playerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playerDuration: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  playerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

